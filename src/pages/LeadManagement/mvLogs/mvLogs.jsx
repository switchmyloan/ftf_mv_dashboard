import { useEffect, useState, useCallback, useMemo } from 'react';
import DataTable from '@components/Table/DataTable';
import { Toaster } from 'react-hot-toast';
import { ivrLogsColumn, leadsColumn } from '../../../components/TableHeader';
import { useNavigate } from 'react-router-dom';
import { getIvrLogs, getLeads } from '../../../api-services/Modules/Leads';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import SummaryCards from '../../../components/Table/SummaryCards';
import { loadCache, saveCache } from '../../../utils/cache-idb';
import { processChunks } from '../../../utils/chunk';
import ToastNotification from '@components/Notification/ToastNotification';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const IVR_MV_LOGS_STATUS_OPTIONS = [
  { value: "success", label: "✅ Success" }, // Will match anything that includes 'success'
  { value: "lead has been rejected.", label: "❌ Rejected" },
  { value: "duplicate user (dedupe)", label: "🔁 Duplicate" },
  { value: "Invalid Data", label: "⚠️ Invalid Data" }, // Placeholder if MoneyView has an Invalid Data message
];

const Leads = () => {
  const navigate = useNavigate();
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportDataList, setExportDataList] = useState([]);
  const [filteredCount1, setFilteredCount1] = useState(0);

  const [query, setQuery] = useState({
    page_no: 1,
    limit: 10,
    search: '',
    filter_date: 'today',
    startDate: null,
    endDate: null,
    status: 'success'
  });

  const [summaryMetrics, setSummaryMetrics] = useState({
    totalLeads: 0,
    successCount: 0,
    rejectCount: 0,
    duplicateCount: 0
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIvrLogs(
        query.filter_date,
        query.startDate,
        query.endDate
      );

      if (res?.data?.success) {
        setRawData(res.data.data || []);
        setFilteredCount1(res.data.pagination?.total || (res.data.data || []).length);

      } else {
        ToastNotification.error('Failed to fetch logs');
      }
    } catch (err) {
      console.error(err);
      ToastNotification.error('Error fetching logs');
    } finally {
      setLoading(false);
    }
  }, [
    query.filter_date, query.startDate, query.fromDate
  ]);


  // const fetchLeads = useCallback(async () => {
  //   setLoading(true);

  //   try {
  //     // Try cache first
  //     const cached = await loadCache("mvi_ivr_logs");
  //     if (cached) {
  //       console.log("Loaded from cache (IndexedDB)");
  //       setRawData(cached);
  //       setLoading(false);
  //       return;
  //     }

  //     // Cache not found OR expired → API call
  //     console.log("Cache expired → API calling...");
  //     const res = await getIvrLogs(
  //       query.filter_date,
  //       query.startDate,
  //       query.endDate
  //     );

  //     if (res?.data?.success) {
  //       const apiData = res.data.data || [];

  //       // PROCESS DATA IN CHUNKS (no UI freeze)
  //       const processed = await processChunks(apiData, 5000);

  //       // Save cache for 10 minutes
  //       await saveCache("mvi_ivr_logs", processed, 5);

  //       setRawData(processed);
  //     } else {
  //       ToastNotification.error("Failed to fetch logs");
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     ToastNotification.error("Failed to fetch logs");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [query.filter_date, query.startDate, query.fromDate]);

  const dynamicMetrics = useMemo(() => {
    // This structure is better for SummaryCards component regardless of fields
    return [
      {
        title: "Total Logs",
        value: summaryMetrics.totalLeads,
        icon: "Users",
        color: "text-blue-600",
        bg: "bg-blue-50"
      },
      {
        title: "Successful",
        value: summaryMetrics.successCount,
        icon: "CheckCircle",
        color: "text-green-600",
        bg: "bg-green-50"
      },
      {
        title: "Rejected",
        value: summaryMetrics.rejectCount,
        icon: "XCircle",
        color: "text-red-600",
        bg: "bg-red-50"
      },
      {
        title: "Duplicate",
        value: summaryMetrics.duplicateCount,
        icon: "TriangleAlert",
        color: "text-yellow-600",
        bg: "bg-yellow-50"
      },
      // If MoneyView uses a specific message for invalid data, add it here:
      // {
      //     title: "Invalid Data",
      //     value: summaryMetrics.invalidDataCount || 0,
      //     icon: "ShieldOff",
      //     color: "text-purple-600",
      //     bg: "bg-purple-50"
      // },
    ];
  }, [summaryMetrics]);

  useEffect(() => {
    let _list = [...rawData];

    if (query.filter_date) {
      const todayTimestamp = new Date().setHours(0, 0, 0, 0);

      const dateForYesterday = new Date();
      dateForYesterday.setDate(dateForYesterday.getDate() - 1);

      const yesterdayTimestamp = dateForYesterday.setHours(0, 0, 0, 0);

      _list = _list.filter(lead => {
        const leadDateTimestamp = new Date(lead.createdAt).setHours(0, 0, 0, 0);

        return query.filter_date === 'today'
          ? leadDateTimestamp === todayTimestamp
          : leadDateTimestamp === yesterdayTimestamp;
      });

    }

    setSummaryMetrics({
      totalLeads: _list.length,
      successCount: _list.filter(lead => {
        const msg = lead?.lender_response?.MoneyView?.message || '';
        const got = msg.toLowerCase().trim();
        return got.includes('success');
      }).length,
      rejectCount: _list.filter(lead => {
        const msg = lead?.lender_response?.MoneyView?.message || '';
        const got = msg.toLowerCase().trim();
        return got.includes('lead has been rejected.');
      }).length,
      duplicateCount: _list.filter(lead => {
        const msg = lead?.lender_response?.MoneyView?.message || '';
        const got = msg.toLowerCase().trim();
        return got.includes('duplicate user (dedupe)');
      }).length
    })
  }, [query.filter_date, query]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const { tableData, filteredCount } = useMemo(() => {
    let list = [...rawData];

    if (query.filter_date) {
      const todayTimestamp = new Date().setHours(0, 0, 0, 0);

      const dateForYesterday = new Date();
      dateForYesterday.setDate(dateForYesterday.getDate() - 1);

      const yesterdayTimestamp = dateForYesterday.setHours(0, 0, 0, 0);

      list = list.filter(lead => {
        const leadDateTimestamp = new Date(lead.createdAt).setHours(0, 0, 0, 0);

        return query.filter_date === 'today'
          ? leadDateTimestamp === todayTimestamp
          : leadDateTimestamp === yesterdayTimestamp;
      });

    }

    // 2. Date Range
    if (query.startDate && query.endDate) {
      // Start date should be the beginning of the day (inclusive)
      const start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0); // Ensure start is 00:00:00 on start date

      // End date should be the end of the day (inclusive)
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999); // Set end to 23:59:59.999 on end date

      // 🛑 REMOVE THIS LINE: end.setDate(end.getDate() + 1); 

      list = list.filter(lead => {
        const d = new Date(lead.createdAt);
        // Change d < end to d <= end to make the end date inclusive
        return d >= start && d <= end;
      });
    }

    // 3. 🔥 STATUS FILTER — SUCCESS = includes, बाकी exact
    if (query.status) {
      const want = query.status.toLowerCase().trim();

      list = list.filter(lead => {
        const msg = lead?.lender_response?.MoneyView?.message || '';
        const got = msg.toLowerCase().trim();

        if (want === 'success') {
          return got.includes('success');
        }
        return got === want;
      });
    }

    // 4. Search (FE fallback)
    if (query.search) {
      const s = query.search.toLowerCase();
      list = list.filter(lead =>
        `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.phone}`
          .toLowerCase()
          .includes(s)
      );
    }

    setExportDataList(list);

    const count = list.length;
    const start = (query.page_no - 1) * query.limit;
    const pageData = list.slice(start, start + query.limit);
    return { tableData: pageData, filteredCount: count };
  }, [rawData, query]);

  const onPageChange = useCallback(p => {
    setQuery(prev => ({ ...prev, page_no: p.pageIndex + 1, limit: p.pageSize }));
  }, []);

  const handleStatusFilter = useCallback(newStatus => {
    setQuery(prev => ({ ...prev, status: newStatus, page_no: 1 }));
  }, []);

  const onSearchHandler = useCallback(term => {
    setQuery(prev => ({ ...prev, search: term, page_no: 1 }));
  }, []);

  const debouncedSearch = useMemo(() => debounce(onSearchHandler, 300), [onSearchHandler]);

  const onFilterByDate = useCallback(type => {
    setQuery(prev => ({
      ...prev,
      filter_date: prev.filter_date === type ? '' : type,
      startDate: null,
      endDate: null,
      page_no: 1
    }));
  }, []);

  const onFilterByRange = useCallback(range => {
    setQuery(prev => ({
      ...prev,
      startDate: range.startDate,
      endDate: range.endDate,
      filter_date: '',
      page_no: 1
    }));
  }, []);

  const handleExport = () => {

    if (exportDataList.length === 0) {
      ToastNotification.success('No data to export based on current filters.');
      return;
    }

    const dataToExport = exportDataList.map(l => ({
      leadId: l?.lender_response?.MoneyView?.data?.resData?.data?.requestBody || 'N/A',
      Name: `${l?.firstName} ${l?.lastName}`,
      Email: l?.email,
      Phone: l.phone,
      salary: l.salary,
      // profession: l.profession,
      pincode: l.pincode,
      // panNumber: l.panNumber,
      // gender: l.gender,
      Status: l.lender_response?.MoneyView?.message || 'N/A',
      Recevied_offer: l.lender_response?.MoneyView?.data?.resData?.data?.response?.offerObjects[0]?.loanAmount || 'N/A',
      Created: new Date(l.createdAt).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const now = new Date();

    const date = now.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');

    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
      .replace(/:/g, '-')
      .replace(' ', '');

    saveAs(
      new Blob([buf]),
      `FTF_filtered_leads_export_${date}_${time}.xlsx`
    );
    ToastNotification.success('Exported successfully!');
  };

  const handleEdit = (lead) => {
    navigate(`/mv-ivr-logs/${lead.id}`, { state: { lead } });
  };

  return (
    <>
      <Toaster />

      <SummaryCards
        metrics={dynamicMetrics}
        loading={loading}
      />
      <DataTable
        columns={ivrLogsColumn({ handleEdit })}
        data={tableData}
        totalDataCount={filteredCount}
        loading={loading}
        onPageChange={onPageChange}
        onSearch={debouncedSearch}
        onRefresh={fetchLeads}
        onExport={handleExport}
        onCreate={() => navigate('/leads/create')}
        createLabel="Add Lead"
        title="IVR MV Logs"

        // Filters
        onFilterByDate={onFilterByDate}
        activeFilter={query.filter_date}
        onFilterByRange={onFilterByRange}
        activeDateRange={{ startDate: query.startDate, endDate: query.endDate }}

        // STATUS FILTER (Using the new dynamic props)
        onStatusFilterChange={handleStatusFilter} // Use the standard dynamic handler name
        statusFilterOptions={IVR_MV_LOGS_STATUS_OPTIONS} // Pass the dynamic options array
        activeStatusFilter={query.status}

      // onFilterChange={handleStatusFilter}
      />
    </>
  );
};

export default Leads;