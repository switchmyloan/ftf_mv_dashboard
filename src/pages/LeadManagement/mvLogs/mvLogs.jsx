// import { useEffect, useState, useMemo } from 'react';
// import DataTable from '@components/Table/DataTable';
// import { Toaster } from 'react-hot-toast';
// import { useNavigate } from 'react-router-dom';
// import ToastNotification from '@components/Notification/ToastNotification';
// import { getLeads } from '../../../api-services/Modules/Leads';
// import { leadsColumn } from '../../../components/TableHeader';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

// const Leads = () => {
//   const navigate = useNavigate();

//   const [rawData, setRawData] = useState([]); // Full data from API
//   const [filteredData, setFilteredData] = useState([]); // After frontend filter
//   const [totalDataCount, setTotalDataCount] = useState(0);
//   const [loading, setLoading] = useState(false);


//   const [query, setQuery] = useState({
//     page_no: 1,
//     limit: 10,
//     search: '',
//     filter_date: '', // 'today' | 'yesterday' | ''
//   });

//   // Fetch all leads (no date filter in API)
//   const fetchLeads = async () => {
//     setLoading(true);
//     try {
//       const response = await getLeads(query.page_no, query.limit, query.search);

//       if (response?.data?.success) {
//         const leads = response.data.data || [];
//         setRawData(leads);
//         setTotalDataCount(response.data.pagination?.total || leads.length);
//       } else {
//         ToastNotification.error('Failed to fetch leads');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       ToastNotification.error('Failed to fetch leads');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Re-fetch when pagination or search changes
//   useEffect(() => {
//     fetchLeads();
//   }, [query.page_no, query.limit, query.search]);

//   // Frontend filtering: Today / Yesterday
//   const filteredLeads = useMemo(() => {
//     if (!query.filter_date) return rawData;

//     const now = new Date();
//     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//     const yesterday = new Date(today);
//     yesterday.setDate(today.getDate() - 1);

//     return rawData.filter((lead) => {
//       const leadDate = new Date(lead.createdAt);
//       const leadDay = new Date(leadDate.getFullYear(), leadDate.getMonth(), leadDate.getDate());

//       if (query.filter_date === 'today') {
//         return leadDay.getTime() === today.getTime();
//       } else if (query.filter_date === 'yesterday') {
//         return leadDay.getTime() === yesterday.getTime();
//       }
//       return true;
//     });
//   }, [rawData, query.filter_date]);

//   // Apply search filter on filteredLeads
//   const searchFiltered = useMemo(() => {
//     if (!query.search) return filteredLeads;

//     const lowerSearch = query.search.toLowerCase();
//     return filteredLeads.filter((lead) =>
//       `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.phone} ${lead.panNumber}`
//         .toLowerCase()
//         .includes(lowerSearch)
//     );
//   }, [filteredLeads, query.search]);

//   // Final data for DataTable
//   const tableData = searchFiltered;

//   // Update DataTable when filter changes
//   useEffect(() => {
//     setFilteredData(tableData);
//   }, [tableData]);

//   // Pagination handler
//   const onPageChange = (pagination) => {
//     setQuery((prev) => ({
//       ...prev,
//       page_no: pagination.pageIndex + 1,
//       limit: pagination.pageSize,
//     }));
//   };

//   // Search handler
//   const onSearch = (searchTerm) => {
//     setQuery((prev) => ({
//       ...prev,
//       search: searchTerm,
//       page_no: 1,
//     }));
//   };

//   // Today / Yesterday filter
//   const onFilterByDate = (type) => {
//     setQuery((prev) => ({
//       ...prev,
//       filter_date: prev.filter_date === type ? '' : type,
//       page_no: 1, // reset page
//     }));
//   };

//   const handleExport = () => {
//     if (tableData.length === 0) {
//       ToastNotification.info('No data to export.');
//       return;
//     }

//     const exportData = tableData.map((lead) => ({
//       'Lead ID': lead.id,
//       'Created At': new Date(lead.createdAt).toLocaleString(),
//       'First Name': lead.firstName,
//       'Last Name': lead.lastName,
//       'Email': lead.email,
//       'Phone': lead.phone,
//       'PAN': lead.panNumber,
//       'DOB': lead.dob ? new Date(lead.dob).toLocaleDateString() : 'N/A',
//       'Profession': lead.profession,
//       'Salary': lead.salary,
//       'Loan Amount': lead.loanAmount,
//       'Pincode': lead.pincode,
//       'MoneyView User': lead.is_moneyview_user ? 'Yes' : 'No',
//       'MoneyView Status': lead.lender_response?.MoneyView?.message || 'N/A',
//       'Is Active': lead.isActive ? 'Yes' : 'No',
//     }));

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Leads');
//     const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     const fileName = `leads_${query.filter_date || 'all'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
//     saveAs(new Blob([excelBuffer]), fileName);

//     ToastNotification.success('Exported successfully!');
//   };

//   const handleEdit = (lead) => {
//     navigate(`/lead-detail/${lead.id}`, { state: { lead } });
//   };

//   const handleCreate = () => {
//     navigate('/leads/create');
//   };

//     const filteredCount = searchFiltered.length;

//   return (
//     <>
//       <Toaster  />
//       <DataTable
//         columns={leadsColumn({ handleEdit })}
//         data={filteredData} // Filtered in frontend
//         totalDataCount={filteredCount}
//         title="Logs"
//         loading={loading}
//         onPageChange={onPageChange}
//         onRefresh={fetchLeads}
//         onExport={handleExport}
       
//         onFilterByDate={onFilterByDate}
     
//   activeFilter={query.filter_date}
//       />
//     </>
//   );
// };

// export default Leads;



import { useEffect, useState, useCallback, useMemo } from 'react';
import DataTable from '@components/Table/DataTable';
import { Toaster } from 'react-hot-toast';
import { ivrLogsColumn, leadsColumn } from '../../../components/TableHeader';
import { useNavigate } from 'react-router-dom';
import { getIvrLogs, getLeads } from '../../../api-services/Modules/Leads';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const Leads = () => {
  const navigate = useNavigate();
  const [rawData, setRawData] = useState([]);
  const [data1, setData1] = useState([]);
  const [loading, setLoading] = useState(false);
   const [exportDataList, setExportDataList] = useState([]); 

  const [query, setQuery] = useState({
    page_no: 1,
    limit: 10,
    search: '',
    filter_date: '',
    startDate: null,
    endDate: null,
    status: 'success'
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIvrLogs(query.page_no, query.limit, query.search);
      if (res?.data?.success) {
        setRawData(res.data.data || []);
        setData1(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [query.page_no, query.limit, query.search]);

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
    // 🛑 NOW USING exportDataList which contains the data filtered by status, date, and search.
    if (exportDataList.length === 0) {
      ToastNotification.info('No data to export based on current filters.');
      return;
    }

    const dataToExport = exportDataList.map(l => ({
      Name: `${l.firstName} ${l.lastName}`,
      Email: l.email,
      Phone: l.phone,
      salary: l.salary,
      profession: l.profession,
      pincode: l.pincode,
      panNumber: l.panNumber,
      // is_moneyview_user: l.is_moneyview_user ? 'Yes' : 'No',
      gender: l.gender,
    //   dob: l.dob ? new Date(l.dob).toLocaleDateString() : 'N/A',
      Status: l.lender_response?.MoneyView?.message || 'N/A',
      Created: new Date(l.createdAt).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });


    // saveAs(new Blob([buf]), `filtered_leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    // 👉 Readable Date + Time
  const now = new Date();

  const date = now.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-'); // 14-Nov-2025

  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  .replace(/:/g, '-')
  .replace(' ', ''); // 10-20AM or 10-20PM

  saveAs(
    new Blob([buf]),
    `filtered_leads_export_${date}_${time}.xlsx`
  );
    ToastNotification.success('Exported successfully!');
  };

  const handleEdit = (lead) => {
    navigate(`/mv-ivr-logs/${lead.id}`, { state: { lead } });
  };

  return (
    <>
      <Toaster />
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

        // STATUS FILTER
        onFilterChange={handleStatusFilter}
        activeStatusFilter={query.status}
      />
    </>
  );
};

export default Leads;