import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Phone, Search, UserRound } from "lucide-react";

import API_BASE_URL from "../config/api";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await axios.get(`${API_BASE_URL}/customers`);
        setCustomers(response.data.customers || []);
      } catch (error) {
        setLoadError(
          error.response?.data?.message ||
            "Unable to load customers. Please check the backend server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Customers</p>
          <h3 className="mt-2 text-2xl font-bold text-[#574848]">{customers.length}</h3>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Showing</p>
          <h3 className="mt-2 text-2xl font-bold text-[#574848]">
            {filteredCustomers.length}
          </h3>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">With Notes</p>
          <h3 className="mt-2 text-2xl font-bold text-[#574848]">
            {customers.filter((customer) => customer.notes).length}
          </h3>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#574848]">Customers</h3>
            <p className="text-sm text-gray-500">
              Customer details from all stitched orders.
            </p>
          </div>

          <div className="flex min-h-11 items-center rounded-xl bg-[#f8f3f4] px-3">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer"
              className="ml-2 w-full bg-transparent text-sm outline-none sm:w-56"
            />
          </div>
        </div>

        {loadError && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {loadError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#efe5e5] text-xs uppercase text-gray-500">
                <th className="py-3 pr-4 font-semibold">Customer</th>
                <th className="py-3 pr-4 font-semibold">Phone</th>
                <th className="py-3 pr-4 font-semibold">Notes</th>
                <th className="py-3 font-semibold">Total Orders</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan="5">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-gray-500" colSpan="5">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="border-b border-[#f4eded] last:border-0">
                    <td className="py-4 pr-4">
                      <p className="flex items-center gap-2 font-semibold text-[#574848]">
                        <UserRound size={15} />
                        {customer.name}
                      </p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="flex items-center gap-2 text-gray-700">
                        <Phone size={14} />
                        {customer.phone || "-"}
                      </p>
                    </td>
                  
                    <td className="py-4 pr-4 text-gray-700">{customer.notes || "-"}</td>
                    <td className="py-4">
                      <span className="rounded-full bg-[#f8f3f4] px-3 py-1 text-xs font-semibold text-[#574848]">
                        {customer.totalOrders}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Customers;
