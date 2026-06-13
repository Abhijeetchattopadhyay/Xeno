import React, { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  TrendingUp, 
  Calendar, 
  Phone, 
  Mail, 
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useStore } from "../store/useStore";

export default function Customers() {
  const customers = useStore((state) => state.customers);
  const total = useStore((state) => state.customersTotal);
  const page = useStore((state) => state.customersPage);
  const pages = useStore((state) => state.customersPages);
  const loading = useStore((state) => state.customersLoading);
  const search = useStore((state) => state.customersSearch);
  const fetchCustomers = useStore((state) => state.fetchCustomers);
  const setSearch = useStore((state) => state.setCustomersSearch);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTraitFilter, setActiveTraitFilter] = useState("");

  useEffect(() => {
    fetchCustomers(1, search);
  }, [search, activeTraitFilter]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pages) {
      fetchCustomers(newPage);
    }
  };

  const selectTraitFilter = (trait) => {
    if (activeTraitFilter === trait) {
      setActiveTraitFilter("");
      fetchCustomers(1, "");
    } else {
      setActiveTraitFilter(trait);
      // We can pass trait to fetch query if backend is updated, or filter locally if needed. 
      // Our backend handles ?trait= query parameter!
      // Let's call api with trait param:
      // useStore state already supports trait filter
    }
  };

  // Trigger api call manually with trait filter
  useEffect(() => {
    // Modify call to fetch with trait
    const queryTrait = activeTraitFilter || undefined;
    useStore.getState().apiCallWithTrait = async () => {
      // Direct call or store action
    };
    // Since useStore fetchCustomers takes (page, search), let's implement trait filter in Zustand if we want.
    // Or we can just fetch using custom params:
    const fetchWithTrait = async () => {
      useStore.setState({ customersLoading: true });
      try {
        const res = await useStore.getState().login && useStore.getState().login !== undefined
          ? null 
          : await require("../store/useStore").api.get("/customers", {
              params: {
                page: 1,
                search,
                trait: queryTrait,
                limit: 15
              }
            });
        if(res) {
          useStore.setState({
            customers: res.data.customers,
            customersTotal: res.data.total,
            customersPage: res.data.page,
            customersPages: res.data.pages,
            customersLoading: false
          });
        }
      } catch (err) {
        useStore.setState({ customersLoading: false });
      }
    };
    
    // Instead of overriding, let's just make direct API call from here to filter, or let's update store.
    // Actually, store's fetchCustomers can be called, let's verify if we can trigger api call directly.
    const runFetch = async () => {
      useStore.setState({ customersLoading: true });
      try {
        const token = localStorage.getItem("xeno_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(`http://localhost:5000/api/customers?page=1&search=${search}${activeTraitFilter ? `&trait=${activeTraitFilter}` : ""}&limit=15`, {
          headers
        });
        const data = await response.json();
        useStore.setState({
          customers: data.customers,
          customersTotal: data.total,
          customersPage: data.page,
          customersPages: data.pages,
          customersLoading: false
        });
      } catch (err) {
        useStore.setState({ customersLoading: false });
      }
    };
    
    runFetch();
  }, [activeTraitFilter, search]);

  const traitsBadges = [
    { id: "high-value", label: "💎 High Value" },
    { id: "repeat-buyer", label: "🔄 Repeat Buyer" },
    { id: "one-time-buyer", label: "👤 One-time" },
    { id: "inactive-30d", label: "💤 Inactive (30d)" },
    { id: "inactive-90d", label: "⚠️ Inactive (90d)" },
    { id: "shoes-buyer", label: "👟 Shoes" },
    { id: "jackets-buyer", label: "🧥 Jackets" },
    { id: "tshirt-buyer", label: "👕 T-Shirts" },
    { id: "electronics-buyer", label: "🔌 Electronics" }
  ];

  return (
    <div className="p-8 flex-1 overflow-hidden h-screen flex gap-8 max-w-7xl mx-auto w-full relative">
      
      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Shopper Directory
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Browse and inspect all seeded customer records and their behavioral traits
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search shoppers by name, email..."
                value={search}
                onChange={handleSearchChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
          </div>

          {/* Trait quick selectors */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5" /> Filter tags:
            </span>
            {traitsBadges.map((badge) => {
              const isSelected = activeTraitFilter === badge.id;
              return (
                <button
                  key={badge.id}
                  onClick={() => selectTraitFilter(badge.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-300 font-medium ${
                    isSelected
                      ? "bg-violet-600/20 border-violet-500/50 text-violet-300 shadow-md shadow-violet-500/5"
                      : "bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/10"
                  }`}
                >
                  {badge.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Directory Table */}
        <div className="flex-1 glass-panel rounded-2xl border-white/5 overflow-hidden flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wider sticky top-0 bg-[#0d0d11]/90 backdrop-blur-md z-10">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email / Phone</th>
                  <th className="py-4 px-6 text-right">Orders</th>
                  <th className="py-4 px-6 text-right">Total Spent</th>
                  <th className="py-4 px-6">Last Active</th>
                  <th className="py-4 px-6">Audience Traits</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-white/5">
                      <td colSpan={6} className="p-4">
                        <div className="w-full h-8 rounded skeleton-pulse" />
                      </td>
                    </tr>
                  ))
                ) : customers.map((customer) => {
                  return (
                    <tr
                      key={customer._id}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all ${
                        selectedCustomer?._id === customer._id ? "bg-white/5" : ""
                      }`}
                    >
                      <td className="py-4 px-6 font-semibold text-gray-200">
                        {customer.firstName} {customer.lastName}
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        <div className="leading-tight">{customer.email}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{customer.phone}</div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-300">
                        {customer.ordersCount}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-gray-200">
                        ₹{customer.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {new Date(customer.lastPurchaseDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {customer.traits.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider rounded bg-white/5 text-gray-400 border border-white/5"
                            >
                              {t.replace("-", " ")}
                            </span>
                          ))}
                          {customer.traits.length > 3 && (
                            <span className="text-[9px] px-1 rounded bg-white/5 text-violet-400 font-bold border border-violet-500/10">
                              +{customer.traits.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      No matching shoppers found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-white/5 flex justify-between items-center bg-[#0d0d11]/40">
            <span className="text-gray-500">
              Showing <span className="font-semibold text-gray-300">{customers.length}</span> of{" "}
              <span className="font-semibold text-gray-300">{total}</span> shoppers
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:border-white/10 disabled:opacity-30 text-gray-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 rounded-lg text-gray-300 bg-white/5 border border-white/10 font-semibold">
                Page {page} / {pages || 1}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pages}
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:border-white/10 disabled:opacity-30 text-gray-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Side Details Sliding Panel */}
      {selectedCustomer && (
        <div className="w-80 h-full border-l border-white/5 p-6 glass-panel flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="p-2 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-500 hover:text-gray-300 p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-gray-100 tracking-tight">
              {selectedCustomer.firstName} {selectedCustomer.lastName}
            </h3>
            <span className="text-[10px] uppercase font-bold text-violet-400 tracking-widest block mt-0.5">
              Shopper Profile
            </span>

            {/* Profile Fields */}
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center gap-3 text-xs">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-gray-300 truncate">{selectedCustomer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-gray-300">{selectedCustomer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-gray-400">
                  Last purchase:{" "}
                  <span className="font-semibold text-gray-300">
                    {new Date(selectedCustomer.lastPurchaseDate).toLocaleDateString()}
                  </span>
                </span>
              </div>
            </div>

            <hr className="border-white/5 my-6" />

            {/* Ecomm Totals */}
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Purchase History
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-500 block">Total Orders</span>
                <span className="text-base font-bold text-gray-200 mt-1 block">
                  {selectedCustomer.ordersCount}
                </span>
              </div>
              <div className="p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-500 block">Total Spending</span>
                <span className="text-base font-bold text-emerald-400 mt-1 block">
                  ₹{selectedCustomer.totalSpent.toLocaleString()}
                </span>
              </div>
            </div>

            <hr className="border-white/5 my-6" />

            {/* Traits */}
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Assigned Traits
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedCustomer.traits.map((trait, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider rounded-lg bg-violet-950/20 text-violet-400 border border-violet-500/10"
                >
                  {trait.replace("-", " ")}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calculated customer lifetime value (LTV) is high.</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
