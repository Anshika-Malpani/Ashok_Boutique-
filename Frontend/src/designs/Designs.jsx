import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import API_BASE_URL from "../config/api";

const categories = [
  "All",
  "Blouse",
  "Kurti",
  "Indo Western",
  "Lehenga",
  "Other Designs",
];

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const getDesignImage = (design) => {
  if (!design?.image) {
    return "";
  }

  if (typeof design.image === "string") {
    return design.image;
  }

  return design.image.preview || design.image.url || "";
};

// Function to shuffle array randomly
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const DesignsPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        setLoadError("");

        let fetchedDesigns = [];
        
        if (activeCategory === "All") {
          // Fetch designs from all categories
          const categoryPromises = categories
            .filter(cat => cat !== "All")
            .map(category => 
              axios.get(`${API_BASE_URL}/designs`, {
                params: { category }
              }).then(response => ({
                category,
                designs: response.data.designs || []
              }))
            );
          
          const results = await Promise.all(categoryPromises);
          fetchedDesigns = results.flatMap(result => result.designs);
          
          // Shuffle to mix all categories randomly
          fetchedDesigns = shuffleArray(fetchedDesigns);
        } else {
          // Fetch designs from specific category
          const response = await axios.get(`${API_BASE_URL}/designs`, {
            params: { category: activeCategory },
          });
          fetchedDesigns = response.data.designs || [];
          // Shuffle within the category
          fetchedDesigns = shuffleArray(fetchedDesigns);
        }
        
        setDesigns(fetchedDesigns);
      } catch (error) {
        setLoadError(
          error.response?.data?.message ||
            "Unable to load designs. Please check the backend server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDesigns();
  }, [activeCategory]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-7xl pt-16">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#574848]">Designs</h1>
            <p className="mt-2 text-sm text-gray-500">
              Explore boutique styles and choose a reference for your custom order.
            </p>
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === category
                    ? "border-[#574848] bg-[#574848] text-white"
                    : "border-[#e8dede] bg-white text-[#574848] hover:bg-[#f8f3f4]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {loadError && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-80 bg-gray-200 rounded-2xl"></div>
                  <div className="mt-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : designs.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-700">No designs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeCategory === "All" 
                  ? "No designs available in any category yet." 
                  : `No designs available in ${activeCategory} category.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {designs.map((design) => {
                const designImage = getDesignImage(design);

                return (
                  <div
                    key={design._id}
                    className="group overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] hover:shadow-[0_30px_50px_-15px_rgba(0,0,0,0.3)] transition-all duration-300 relative"
                  >
                    
                    
                    {/* Image Container with overlay */}
                    <div className="h-80 overflow-hidden bg-gradient-to-br from-[#f8f3f4] to-[#f0e8ea] relative">
                      {designImage ? (
                        <>
                          <img
                            src={designImage}
                            alt={design.title}
                            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                          />
                          {/* Gradient overlay on image */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400 bg-gray-50">
                          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-400">No image available</p>
                        </div>
                      )}
                    </div>
                  
                    {/* Content Container */}
                    <div className="p-5 pb-24 bg-white relative">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold text-[#574848] line-clamp-1 group-hover:text-[#6b5555] transition-colors">
                            {design.title}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              {design.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="bg-gradient-to-r from-[#dccbce] to-[#ceb7bb] px-4 py-1.5 rounded-full text-base font-bold text-[#574848] shadow-sm whitespace-nowrap">
                            {formatMoney(design.price)}
                          </span>
                          {design.originalPrice && (
                            <span className="text-xs text-gray-400 line-through mt-1">
                              {formatMoney(design.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {design.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                          {design.description}
                        </p>
                      )}
                    </div>
                  
                    {/* Button Container */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 pt-0 bg-gradient-to-t from-white via-white to-transparent">
                      <button
                        type="button"
                        onClick={() => navigate(`/design/${design._id}`)}
                        className="w-full rounded-xl bg-gradient-to-r from-[#574848] to-[#463838] py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:from-[#463838] hover:to-[#362a2a] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md relative overflow-hidden group/btn"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          View Details
                          <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                        <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Show category distribution info when in All category */}
          {activeCategory === "All" && designs.length > 0 && !loading && (
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                Showing a curated mix of designs from all categories
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default DesignsPage;