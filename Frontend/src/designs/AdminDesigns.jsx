import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ImagePlus,
  IndianRupee,
  Layers3,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";

import API_BASE_URL from "../config/api";

const categories = ["Blouse", "Kurti", "Indo Western", "Lehenga", "Other Designs"];

const emptyForm = {
  title: "",
  category: "Blouse",
  description: "",
  price: "",
  image: null,
};

const formatMoney = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const AdminDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        setAlert({ type: "", message: "" });

        const response = await axios.get(`${API_BASE_URL}/designs`);
        setDesigns(response.data.designs || []);
      } catch (error) {
        setAlert({
          type: "error",
          message:
            error.response?.data?.message ||
            "Unable to load designs. Please check the backend server.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDesigns();
  }, []);

  const filteredDesigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return designs;
    }

    return designs.filter((design) =>
      [design.title, design.category, design.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [designs, query]);

  const categoryMetrics = useMemo(
    () =>
      categories.map((category) => ({
        category,
        count: designs.filter((design) => design.category === category).length,
      })),
    [designs]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        image: {
          name: file.name,
          preview: reader.result,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setForm((current) => ({ ...current, image: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setAlert({ type: "", message: "" });

      const response = await axios.post(`${API_BASE_URL}/designs`, {
        ...form,
        price: Number(form.price || 0),
        image: form.image || {},
      });

      setDesigns((current) => [response.data.design, ...current]);
      setForm(emptyForm);
      setAlert({
        type: "success",
        message: response.data.message || "Design added successfully.",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save design. Please check the form and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {categoryMetrics.map((item) => (
          <div key={item.category} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{item.category}</p>
            <h3 className="mt-2 text-2xl font-bold text-[#574848]">{item.count}</h3>
          </div>
        ))}
      </div>

      {alert.message && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            alert.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-[#f8f3f4] p-3 text-[#574848]">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#574848]">Add Design</h3>
              <p className="text-sm text-gray-500">
                Save boutique designs with price and image.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#574848]">
                Title
              </span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g. Mirror Work Blouse"
                className="w-full rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#574848]">
                Category
              </span>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#e8dede] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#574848]">
                Design Price
              </span>
              <div className="flex min-h-12 items-center rounded-xl border border-[#e8dede] px-4 transition focus-within:border-[#574848]">
                <IndianRupee size={16} className="text-gray-500" />
                <input
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  required
                  placeholder="1500"
                  className="ml-2 w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#574848]">
                Description
              </span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe fabric, work, pattern, and styling details."
                className="w-full resize-none rounded-xl border border-[#e8dede] px-4 py-3 text-sm outline-none transition focus:border-[#574848]"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-medium text-[#574848]">
                Design Image
              </span>
              {form.image?.preview ? (
                <div className="overflow-hidden rounded-2xl border border-[#efe5e5]">
                  <img
                    src={form.image.preview}
                    alt={form.title || "Design preview"}
                    className="h-64 w-full object-contain"
                  />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <p className="truncate text-sm text-gray-500">{form.image.name}</p>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#e8dede] px-3 py-2 text-xs font-semibold text-[#574848] transition hover:bg-[#f8f3f4]"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9caca] bg-[#fcf9f9] px-4 text-center transition hover:bg-[#f8f3f4]">
                  <ImagePlus size={30} className="text-[#574848]" />
                  <span className="mt-3 text-sm font-semibold text-[#574848]">
                    Upload design image
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    JPG, PNG, or WebP preview
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#574848] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#463838] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Design"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#574848]">Design Library</h3>
              <p className="text-sm text-gray-500">
                Designs customers can browse from the website.
              </p>
            </div>

            <div className="flex min-h-11 items-center rounded-xl bg-[#f8f3f4] px-3">
              <Search size={18} className="text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search designs"
                className="ml-2 w-full bg-transparent text-sm outline-none sm:w-56"
              />
            </div>
          </div>

          {loading ? (
            <p className="rounded-2xl bg-[#fcf9f9] p-6 text-sm text-gray-500">
              Loading designs...
            </p>
          ) : filteredDesigns.length === 0 ? (
            <div className="rounded-2xl bg-[#fcf9f9] p-8 text-center">
              <Layers3 size={34} className="mx-auto text-[#574848]/50" />
              <p className="mt-3 text-sm text-gray-500">No designs found.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDesigns.map((design) => (
                <div
                  key={design._id}
                  className="overflow-hidden rounded-2xl border border-[#efe5e5] bg-white"
                >
                  <div className="h-56 bg-[#f8f3f4]">
                    {design.image?.preview ? (
                      <img
                        src={design.image.preview}
                        alt={design.title}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#574848]/50">
                        <ImagePlus size={34} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-[#574848]">{design.title}</h4>
                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          {design.category}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#dccbce] px-3 py-1 text-xs font-bold text-[#574848] whitespace-nowrap">
                        {formatMoney(design.price)}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-sm leading-6 text-gray-600">
                      {design.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDesigns;
