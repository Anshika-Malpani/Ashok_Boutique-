import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarClock,
  Pencil,
  Phone,
  Plus,
  Ruler,
  Save,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import API_BASE_URL from "../config/api";

const emptyEditForm = {
  garmentType: "",
  notes: "",
  measurements: {},
  customMeasurements: [],
};

const getMeasurementValues = (measurement) => {
  if (!measurement?.measurements) {
    return {};
  }

  return { ...measurement.measurements };
};

const createEditForm = (measurement) => ({
  garmentType: measurement?.garmentType || "",
  notes: measurement?.notes || "",
  measurements: getMeasurementValues(measurement),
  customMeasurements: Array.isArray(measurement?.customMeasurements)
    ? measurement.customMeasurements.map((item, idx) => ({
        id: item._id || `custom-${idx}-${Date.now()}`,
        name: item.name || "",
        value: item.value ?? "",
      }))
    : [],
});

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Helper function to check if a measurement has any actual measurement data
const hasMeasurementData = (measurement) => {
  // Check if there are any standard measurements
  const hasStandardMeasurements = measurement.measurements && 
    Object.keys(measurement.measurements).length > 0 &&
    Object.values(measurement.measurements).some(value => value !== "" && value !== null && value !== undefined);
  
  // Check if there are any custom measurements
  const hasCustomMeasurements = measurement.customMeasurements && 
    measurement.customMeasurements.length > 0 &&
    measurement.customMeasurements.some(item => item.value !== "" && item.value !== null && item.value !== undefined);
  
  return hasStandardMeasurements || hasCustomMeasurements;
};

const Measurements = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [measurements, setMeasurements] = useState([]);
  const [query, setQuery] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [measurementError, setMeasurementError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        setLoadError("");

        const response = await axios.get(`${API_BASE_URL}/customers`);
        const loadedCustomers = response.data.customers || [];
        setCustomers(loadedCustomers);

        if (loadedCustomers.length) {
          setSelectedCustomerId((current) => current || loadedCustomers[0]._id);
        }
      } catch (error) {
        setLoadError(
          error.response?.data?.message ||
            "Unable to load customers. Please check the backend server."
        );
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) {
      return;
    }

    const fetchMeasurements = async () => {
      try {
        setLoadingMeasurements(true);
        setMeasurementError("");
        setEditingId("");
        setSaveMessage("");

        const response = await axios.get(`${API_BASE_URL}/measurements`, {
          params: { customerId: selectedCustomerId },
        });
        
        const allMeasurements = response.data.measurements || [];
        
        // Group measurements by garmentType and get the latest non-empty one for each
        const latestNonEmptyByGarment = new Map();
        
        // Sort measurements by date (newest first) to ensure we get the latest
        const sortedMeasurements = [...allMeasurements].sort((first, second) => {
          const firstDate = new Date(first.updatedDate || first.updatedAt).getTime();
          const secondDate = new Date(second.updatedDate || second.updatedAt).getTime();
          return secondDate - firstDate;
        });
        
        // For each measurement, if it's non-empty and we don't have an entry for its garment type yet, add it
        sortedMeasurements.forEach(measurement => {
          const garmentType = measurement.garmentType || "Uncategorized";
          
          // Only consider this measurement if it has actual measurement data
          if (hasMeasurementData(measurement) && !latestNonEmptyByGarment.has(garmentType)) {
            latestNonEmptyByGarment.set(garmentType, measurement);
          }
        });
        
        // Convert the map values to an array
        const filteredMeasurements = Array.from(latestNonEmptyByGarment.values());
        
        setMeasurements(filteredMeasurements);
      } catch (error) {
        setMeasurementError(
          error.response?.data?.message ||
            "Unable to load measurements for this customer."
        );
      } finally {
        setLoadingMeasurements(false);
      }
    };

    fetchMeasurements();
  }, [selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.address]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [customers, query]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer._id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // Calculate total unique garment types with non-empty measurements
  const uniqueGarmentCount = measurements.length;

  const latestMeasurementDate = measurements[0]?.updatedDate || measurements[0]?.updatedAt;

  const startEditing = (measurement) => {
    setEditingId(measurement._id);
    setEditForm(createEditForm(measurement));
    setSaveMessage("");
    setMeasurementError("");
  };

  const cancelEditing = () => {
    setEditingId("");
    setEditForm(emptyEditForm);
  };

  const updateMeasurementValue = (name, value) => {
    setEditForm((current) => ({
      ...current,
      measurements: {
        ...current.measurements,
        [name]: value,
      },
    }));
  };

  const updateCustomMeasurement = (id, field, value) => {
    setEditForm((current) => ({
      ...current,
      customMeasurements: current.customMeasurements.map((measurement) =>
        measurement.id === id ? { ...measurement, [field]: value } : measurement
      ),
    }));
  };

  const addCustomMeasurement = () => {
    setEditForm((current) => ({
      ...current,
      customMeasurements: [
        ...current.customMeasurements,
        { 
          id: `new-${Date.now()}-${Math.random()}`, 
          name: "", 
          value: "" 
        },
      ],
    }));
  };

  const removeCustomMeasurement = (id) => {
    setEditForm((current) => ({
      ...current,
      customMeasurements: current.customMeasurements.filter(
        (measurement) => measurement.id !== id
      ),
    }));
  };

  const saveMeasurement = async () => {
    if (!editingId) {
      return;
    }

    // Clean up the custom measurements by removing temporary IDs before saving
    const cleanedEditForm = {
      ...editForm,
      customMeasurements: editForm.customMeasurements.map(({ id, ...rest }) => rest),
    };

    try {
      setSaving(true);
      setSaveMessage("");
      setMeasurementError("");

      const response = await axios.put(
        `${API_BASE_URL}/measurements/${editingId}`,
        cleanedEditForm
      );
      const updatedMeasurement = response.data.measurement;

      // After saving, we need to refresh the filtered list
      const fetchResponse = await axios.get(`${API_BASE_URL}/measurements`, {
        params: { customerId: selectedCustomerId },
      });
      
      const allMeasurements = fetchResponse.data.measurements || [];
      
      // Re-apply the filtering logic
      const latestNonEmptyByGarment = new Map();
      const sortedMeasurements = [...allMeasurements].sort((first, second) => {
        const firstDate = new Date(first.updatedDate || first.updatedAt).getTime();
        const secondDate = new Date(second.updatedDate || second.updatedAt).getTime();
        return secondDate - firstDate;
      });
      
      sortedMeasurements.forEach(measurement => {
        const garmentType = measurement.garmentType || "Uncategorized";
        if (hasMeasurementData(measurement) && !latestNonEmptyByGarment.has(garmentType)) {
          latestNonEmptyByGarment.set(garmentType, measurement);
        }
      });
      
      const filteredMeasurements = Array.from(latestNonEmptyByGarment.values());
      
      setMeasurements(filteredMeasurements);
      setEditingId("");
      setEditForm(emptyEditForm);
      setSaveMessage("Measurement updated successfully.");
    } catch (error) {
      setMeasurementError(
        error.response?.data?.message || "Unable to save this measurement."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Customers</p>
          <h3 className="mt-2 text-2xl font-bold text-[#574848]">
            {customers.length}
          </h3>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Selected Customer</p>
          <h3 className="mt-2 truncate text-2xl font-bold text-[#574848]">
            {selectedCustomer?.name || "-"}
          </h3>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Garments with Measurements</p>
          <h3 className="mt-2 text-2xl font-bold text-[#574848]">
            {uniqueGarmentCount}
          </h3>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Latest Update</p>
          <h3 className="mt-2 text-2xl font-bold text-[#574848]">
            {formatDate(latestMeasurementDate)}
          </h3>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {loadError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-[#574848]">Customers</h3>
            <p className="text-sm text-gray-500">
              Select a customer to view their latest measurements.
            </p>
          </div>

          <div className="mb-4 flex min-h-11 items-center rounded-xl bg-[#f8f3f4] px-3">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer"
              className="ml-2 w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {loadingCustomers ? (
              <p className="rounded-xl bg-[#f8f3f4] px-4 py-5 text-center text-sm text-gray-500">
                Loading customers...
              </p>
            ) : filteredCustomers.length === 0 ? (
              <p className="rounded-xl bg-[#f8f3f4] px-4 py-5 text-center text-sm text-gray-500">
                No customers found
              </p>
            ) : (
              filteredCustomers.map((customer) => {
                const active = customer._id === selectedCustomerId;

                return (
                  <button
                    key={customer._id}
                    type="button"
                    onClick={() => setSelectedCustomerId(customer._id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-[#574848] bg-[#574848] text-white"
                        : "border-[#efe5e5] bg-white text-[#574848] hover:bg-[#f8f3f4]"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 rounded-full p-2 ${
                          active ? "bg-white/15" : "bg-[#f8f3f4]"
                        }`}
                      >
                        <UserRound size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {customer.name}
                        </span>
                        <span
                          className={`mt-1 flex items-center gap-1 text-xs ${
                            active ? "text-white/75" : "text-gray-500"
                          }`}
                        >
                          <Phone size={12} />
                          {customer.phone || "-"}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#574848]">
                {selectedCustomer?.name || "Customer Measurements"}
              </h3>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Phone size={14} />
                  {selectedCustomer?.phone || "-"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={14} />
                  {formatDate(latestMeasurementDate)}
                </span>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f8f3f4] px-3 py-1 text-sm font-semibold text-[#574848]">
              <Ruler size={15} />
              {uniqueGarmentCount} garments with measurements
            </span>
          </div>

          {measurementError && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {measurementError}
            </div>
          )}

          {saveMessage && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {saveMessage}
            </div>
          )}

          {loadingMeasurements ? (
            <div className="rounded-2xl bg-[#f8f3f4] px-4 py-10 text-center text-sm text-gray-500">
              Loading measurements...
            </div>
          ) : !selectedCustomerId ? (
            <div className="rounded-2xl bg-[#f8f3f4] px-4 py-10 text-center text-sm text-gray-500">
              Select a customer
            </div>
          ) : measurements.length === 0 ? (
            <div className="rounded-2xl bg-[#f8f3f4] px-4 py-10 text-center text-sm text-gray-500">
              No measurements with data found for this customer
            </div>
          ) : (
            <div className="space-y-5">
              {measurements.map((measurement, index) => {
                const isEditing = editingId === measurement._id;
                const values = getMeasurementValues(measurement);
                const measurementEntries = Object.entries(
                  isEditing ? editForm.measurements : values
                );
                const customMeasurements = isEditing
                  ? editForm.customMeasurements
                  : (measurement.customMeasurements || []).map((item, idx) => ({
                      id: item._id || `custom-${idx}`,
                      ...item,
                    }));
                
                // Check if notes exist and are not empty/whitespace
                const hasNotes = measurement.notes && measurement.notes.trim() !== "";

                return (
                  <article
                    key={measurement._id}
                    className="rounded-2xl border border-[#efe5e5] p-4 md:p-5"
                  >
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#f8f3f4] px-3 py-1 text-xs font-semibold text-[#574848]">
                            Latest {measurement.garmentType || "Measurement"}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(measurement.updatedDate || measurement.updatedAt)}
                          </span>
                        </div>

                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.garmentType}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                garmentType: event.target.value,
                              }))
                            }
                            placeholder="Garment type"
                            className="mt-3 w-full rounded-xl border border-[#e8dede] px-3 py-2 text-lg font-bold text-[#574848] outline-none focus:border-[#574848] sm:w-72"
                          />
                        ) : (
                          <h4 className="mt-3 text-lg font-bold text-[#574848]">
                            {measurement.garmentType || "Measurement"}
                          </h4>
                        )}

                        {measurement.orderId?.orderNumber && (
                          <p className="mt-1 text-sm text-gray-500">
                            {measurement.orderId.orderNumber}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={saveMeasurement}
                              disabled={saving}
                              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#574848] px-4 text-sm font-semibold text-white transition hover:bg-[#463a3a] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <Save size={16} />
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e8dede] px-4 text-sm font-semibold text-[#574848] transition hover:bg-[#f8f3f4]"
                            >
                              <X size={16} />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditing(measurement)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e8dede] px-4 text-sm font-semibold text-[#574848] transition hover:bg-[#f8f3f4]"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>

                    {measurementEntries.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {measurementEntries.map(([name, value]) => (
                          <label
                            key={name}
                            className="rounded-xl border border-[#f0e6e6] bg-[#fcf9f9] p-3"
                          >
                            <span className="block text-xs font-semibold uppercase text-gray-500">
                              {name}
                            </span>
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={value ?? ""}
                                onChange={(event) =>
                                  updateMeasurementValue(name, event.target.value)
                                }
                                className="mt-2 w-full rounded-lg border border-[#e8dede] bg-white px-3 py-2 text-sm font-semibold text-[#574848] outline-none focus:border-[#574848]"
                              />
                            ) : (
                              <span className="mt-2 block text-lg font-bold text-[#574848]">
                                {value ?? "-"}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-[#f8f3f4] px-4 py-5 text-center text-sm text-gray-500">
                        No standard values saved
                      </p>
                    )}

                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="font-semibold text-[#574848]">
                          Custom Measurements
                        </h4>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={addCustomMeasurement}
                            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#e8dede] px-3 text-sm font-semibold text-[#574848] transition hover:bg-[#f8f3f4]"
                          >
                            <Plus size={15} />
                            Add
                          </button>
                        )}
                      </div>

                      {customMeasurements.length === 0 ? (
                        <p className="rounded-xl bg-[#f8f3f4] px-4 py-4 text-sm text-gray-500">
                          No custom measurements
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {customMeasurements.map((item) => (
                            <div
                              key={item.id}
                              className="grid gap-3 rounded-xl border border-[#f0e6e6] bg-[#fcf9f9] p-3 sm:grid-cols-[1fr_160px_auto]"
                            >
                              {isEditing ? (
                                <>
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(event) =>
                                      updateCustomMeasurement(
                                        item.id,
                                        "name",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Name"
                                    className="rounded-lg border border-[#e8dede] bg-white px-3 py-2 text-sm outline-none focus:border-[#574848]"
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.value ?? ""}
                                    onChange={(event) =>
                                      updateCustomMeasurement(
                                        item.id,
                                        "value",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Value"
                                    className="rounded-lg border border-[#e8dede] bg-white px-3 py-2 text-sm outline-none focus:border-[#574848]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeCustomMeasurement(item.id)}
                                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-rose-200 px-3 text-rose-700 transition hover:bg-rose-50"
                                    aria-label="Remove custom measurement"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <p className="font-semibold text-[#574848]">
                                    {item.name}
                                  </p>
                                  <p className="font-bold text-[#574848]">
                                    {item.value ?? "-"}
                                  </p>
                                  <span />
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notes section - only show if there are notes or if editing */}
                    {(hasNotes || isEditing) && (
                      <div className="mt-5">
                        <h4 className="mb-2 font-semibold text-[#574848]">Notes</h4>
                        {isEditing ? (
                          <textarea
                            value={editForm.notes}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                notes: event.target.value,
                              }))
                            }
                            rows="3"
                            placeholder="Stitching notes"
                            className="w-full resize-none rounded-xl border border-[#e8dede] px-3 py-2 text-sm outline-none focus:border-[#574848]"
                          />
                        ) : (
                          <p className="rounded-xl bg-[#f8f3f4] px-4 py-4 text-sm text-gray-600">
                            {measurement.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Measurements;