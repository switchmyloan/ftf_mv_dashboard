import { useEffect, useState, useCallback, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { ivrLogsColumn } from '../../../components/TableHeader';
import { useNavigate } from 'react-router-dom';
import { getIvrLogs } from '../../../api-services/Modules/Leads';
import SummaryCards from '../../../components/Table/SummaryCards';
import ToastNotification from '@components/Notification/ToastNotification';
import ExportModal from '../../../components/ExportModal';
import MainTable from '../../../components/Table/MainTable';

// Simple debounce helper
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const Leads = () => {
  const navigate = useNavigate();

  // Raw list from API (unpaged)
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDataList, setExportDataList] = useState([]);
  const [filteredCount, setFilteredCount] = useState(0);
  const [query, setQuery] = useState({
    page_no: 1,
    limit: 10,
    search: '',
    filter_date: 'today', // 'today' | 'yesterday' | ''
    startDate: null,
    endDate: null,
    status: 'success'
  });

  // Summary metrics (prefer backend summary if available)
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalLeads: 0,
    successCount: 0,
    rejectCount: 0,
    duplicateCount: 0
  });

  const getLeadStatusMsg = (lead) => {
    return (lead?.lender_response?.MoneyView?.message || '').toLowerCase().trim();
  };
  // Fetch logs from backend (keeps api signature unchanged)
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIvrLogs({
        type: query.filter_date || null,
        fromDate: query.startDate,
        toDate: query.endDate,
        perPage: query.limit,
        currentPage: query.page_no,
        status: query.status,
        search: query.search
      });
      // Expectation: res?.data?.success and res.data.data array
      if (res?.data) {
        const apiData = res.data.data || [];

        setRawData(apiData);
        setFilteredCount(res.data.pagination.total || 0);
        setSummaryMetrics({
          totalLeads: res?.data?.summaryObj?.total || 0,
          successCount: res?.data?.summaryObj?.success,
          rejectCount: res?.data?.summaryObj?.reject,
          duplicateCount: res?.data?.summaryObj?.duplicate
        });

      } else {
        ToastNotification.error('Failed to fetch logs');
      }
    } catch (err) {
      console.error('fetchLeads err', err);
      ToastNotification.error('Error fetching logs');
    } finally {
      setLoading(false);
    }
  }, [query.filter_date, query.startDate, query.endDate, query.limit, query.page_no, query.status, query.search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Table data: apply date filters, range, status, search, then paginate
  const { tableData } = useMemo(() => {
    let list = [...rawData];

    const wantStatus = query.status.toLowerCase().trim();
    list = list.filter(lead => {
      const got = getLeadStatusMsg(lead);
      if (wantStatus === 'success') return got.includes('success');
      if (wantStatus === 'reject') return got.includes('lead has been rejected');
      if (wantStatus.includes('duplicate')) return got.includes('duplicate user (dedupe)');
      return true;
    });

    if (query.search) {
      const s = query.search.toLowerCase();
      list = list.filter(lead =>
        `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.phone}`
          .toLowerCase()
          .includes(s)
      );
    }

    return { tableData: list };
  }, [rawData, query.search, query.status]);

  // Pagination handler (DataTable provides pageIndex & pageSize)
  const onPageChange = useCallback((pageInfo) => {
    setQuery((prevQuery) => {
      return {
        ...prevQuery,
        page_no: pageInfo.pageIndex + 1, // 1-based index for query
        limit: pageInfo.pageSize, // new limit
      };
    });
  }, []);

  const handleStatusFilter = useCallback((newStatus) => {
    console.log("status", newStatus)
    setQuery(prev => ({ ...prev, status: newStatus, page_no: 1 }));
  }, []);

  const onSearchHandler = useCallback((term) => {
    setQuery(prev => ({ ...prev, search: term, page_no: 1 }));
  }, []);

  const debouncedSearch = useMemo(() => debounce(onSearchHandler, 300), [onSearchHandler]);

  const onFilterByDate = useCallback((type) => {
    setQuery(prev => ({
      ...prev,
      filter_date: prev.filter_date === type ? '' : type,
      startDate: null,
      endDate: null,
      page_no: 1
    }));
  }, []);

  const onFilterByRange = useCallback((range) => {
    setQuery(prev => ({
      ...prev,
      startDate: range.startDate,
      endDate: range.endDate,
      filter_date: '',
      page_no: 1
    }));
  }, []);


  const handleExport = () => setExportModalOpen(true);

  const handleExportSubmit = async ({ startDate, endDate, mode }) => {
    setExportLoading(true);
    let urlParams = new URLSearchParams({ mode: "download" });
    let downloadFileName;

    const now = new Date();
    const date = now.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).replace(/:/g, "-").replace(" ", "");

    if (mode === "today" || mode === "yesterday") {
      urlParams.append("type", mode);
      downloadFileName = `MV_Leads_${date}_${time}.csv`;
    } else if (mode === "range" && startDate && endDate) {
      urlParams.append("fromDate", startDate);
      urlParams.append("toDate", endDate);
      downloadFileName = `SML_MV_SUCCESS_Leads_${startDate}_to_${endDate}.csv`;
    } else {
      ToastNotification.error("Please select valid export filter.");
      setExportLoading(false);
      return;
    }

    try {
      ToastNotification.success("Starting CSV download...");
      const url = `${import.meta.env.VITE_API_URL}/leads/mv-success-leads-export?${urlParams.toString()}`;
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      ToastNotification.success("Download started!");
    } catch (err) {
      console.error(err);
      ToastNotification.error("Export failed!");
    } finally {
      setExportLoading(false);
      setExportModalOpen(false);
    }
  };

  const handleEdit = (lead) => {
    navigate(`/mv-ivr-logs/${lead.id}`, { state: { lead } });
  };

  // prepare dynamic metrics for SummaryCards component
  const dynamicMetrics = useMemo(() => [
    {
      title: "Total Logs",
      value: Number(summaryMetrics.totalLeads) || 0,
      icon: "Users",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Successful",
      value: Number(summaryMetrics.successCount) || 0,
      icon: "CheckCircle",
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Rejected",
      value: Number(summaryMetrics.rejectCount) || 0,
      icon: "XCircle",
      color: "text-red-600",
      bg: "bg-red-50"
    },
    {
      title: "Duplicate",
      value: Number(summaryMetrics.duplicateCount) || 0,
      icon: "TriangleAlert",
      color: "text-yellow-600",
      bg: "bg-yellow-50"
    }
  ], [summaryMetrics]);

  return (
    <>
      <Toaster />

      <SummaryCards
        metrics={dynamicMetrics}
        loading={loading}
      />

      <ExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onSubmit={handleExportSubmit}
        isSubmitting={exportLoading}
      />

      <MainTable
        columns={ivrLogsColumn({ handleEdit })}
        data={rawData}
        totalDataCount={filteredCount}
        loading={loading}
        onPageChange={onPageChange}
        onSearch={debouncedSearch}
        onRefresh={fetchLeads}
        onExport={handleExport}
        // onCreate={() => navigate('/leads/create')}
        createLabel="Add Lead"
        title="IVR MV LOGS"

        // Filters
        onFilterByDate={onFilterByDate}
        activeFilter={query.filter_date}
        onFilterByRange={onFilterByRange}
        activeDateRange={{ startDate: query.startDate, endDate: query.endDate }}

        // STATUS FILTER
        onFilterChange={handleStatusFilter}
        activeStatusFilter={query.status}
      />
    </>
  );
};

export default Leads;
