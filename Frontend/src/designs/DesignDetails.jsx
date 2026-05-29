import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import API_BASE_URL from "../config/api";

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const DesignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchDesign = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await axios.get(`${API_BASE_URL}/designs/${id}`);
        setDesign(response.data.design);
      } catch (error) {
        setLoadError(
          error.response?.data?.message ||
            "Unable to load design details. Please check the backend server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDesign();
  }, [id]);

  const sendWhatsApp = () => {
    if (!design) return;

    const phone = "919252010850";
    const message = `Hello, I'm interested in ${design.title}. Please share more details.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 md:px-10">
          <div className="mx-auto max-w-7xl pt-16">
            <div className="animate-pulse">
              <div className="mb-6 h-10 w-24 rounded-xl bg-gray-200"></div>
              <div className="grid gap-8 rounded-3xl bg-white shadow-xl md:grid-cols-2">
                <div className="h-[600px] rounded-l-3xl bg-gray-200"></div>
                <div className="space-y-6 p-8">
                  <div className="h-8 w-32 rounded-full bg-gray-200"></div>
                  <div className="h-12 w-3/4 rounded-lg bg-gray-200"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full rounded bg-gray-200"></div>
                    <div className="h-4 w-5/6 rounded bg-gray-200"></div>
                    <div className="h-4 w-4/6 rounded bg-gray-200"></div>
                  </div>
                  <div className="h-10 w-40 rounded-lg bg-gray-200"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (loadError || !design) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 md:px-10">
          <div className="mx-auto max-w-7xl pt-16">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 p-8 text-center shadow-lg">
              <svg className="mx-auto mb-4 h-16 w-16 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mb-2 text-xl font-semibold text-rose-800">Design Not Found</h3>
              <p className="text-rose-600">{loadError || "The design you're looking for doesn't exist."}</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 md:px-10">
        <div className="mx-auto max-w-7xl pt-16">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-white hover:shadow-md"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Gallery
          </button>

          {/* Main Content - Full image on left */}
          <div className="grid gap-0 rounded-3xl bg-white shadow-2xl overflow-hidden md:grid-cols-2">
            {/* Left Side - Full Image */}
            <div className="bg-gray-200 flex items-center justify-center p-8 min-h-[600px]">
              {design.image?.preview ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={design.image.preview}
                    alt={design.title}
                    className="w-full h-auto  object-cover object-top "
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <svg className="mb-4 h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-400">No image available</p>
                </div>
              )}
            </div>

            {/* Right Side - Design Details */}
            <div className="flex flex-col p-8 md:p-10 bg-white">
              <div>
                {/* Category Badge */}
                <span className="inline-flex rounded-full bg-gradient-to-r from-[#dccbce] to-[#ceb7bb] px-4 py-1.5 text-xs font-bold text-[#574848] shadow-sm">
                  {design.category}
                </span>

                {/* Title */}
                <h1 className="mt-4 text-4xl font-bold leading-tight text-[#574848]">
                  {design.title}
                </h1>

                {/* Price - For display purposes only */}
                <div className="mt-4">
                  <p className="text-2xl font-bold text-[#574848]">
                    {formatMoney(design.price)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">*Reference price only</p>
                </div>

                {/* Description */}
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-[#574848]">About This Design</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="leading-relaxed text-gray-600">
                      {design.description || "No description available for this design."}
                    </p>
                  </div>
                </div>

                {/* Design Details/Specs */}
                <div className="mt-8">
                  <h3 className="mb-3 text-lg font-semibold text-[#574848]">Design Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="h-5 w-5 text-[#574848]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">Unique design concept</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="h-5 w-5 text-[#574848]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600">Premium quality materials</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="h-5 w-5 text-[#574848]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">Customizable options available</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={sendWhatsApp}
                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-green-200 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.165-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    </svg>
                    <span>Inquire on WhatsApp</span>
                    <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0"></div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/appointment")}
                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#574848] to-[#463838] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Book Consultation</span>
                    <div className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0"></div>
                  </button>
                </div>

                {/* Note */}
                <div className="mt-6 rounded-lg bg-amber-50 p-3 border border-amber-100">
                  <p className="text-xs text-amber-700 flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    This is a design showcase. For custom orders or modifications, please contact us.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default DesignDetails;