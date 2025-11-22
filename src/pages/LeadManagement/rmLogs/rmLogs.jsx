import { useEffect, useState, useCallback, useMemo } from 'react';
import DataTable from '@components/Table/DataTable';
import { Toaster } from 'react-hot-toast';
import { ivrLogsColumn, leadsColumn, rmLogsColumn } from '../../../components/TableHeader';
import { useNavigate } from 'react-router-dom';
import { getIvrLogs, getLeads, getRmLogs } from '../../../api-services/Modules/Leads';
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

const RM_LOGS_STATUS_OPTIONS = [
    { value: "Attributed Successfully", label: "✅ Success" },
    { value: "Dedup Fail", label: "🔁 Dedup Fail" },
    { value: "Too many requests, please try again later.", label: "⚠️ Rate Limit Error" },
    { value: "invalid data to get offer for lead", label: "⚠️ Invalid Data" },
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
        filter_date: '',
        startDate: null,
        endDate: null,
        status: 'Attributed Successfully'
    });

    const [summaryMetrics, setSummaryMetrics] = useState({
        totalLeads: 0,
        successCount: 0,
        rejectCount: 0,
        duplicateCount: 0,
        invalidDataCount: 0
    });

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getRmLogs(
                query.filter_date,
                query.startDate,
                query.endDate
            );

            if (res?.data?.success) {
                setRawData(res.data.data || []);
                // setFilteredCount1(res.data.pagination?.total || (res.data.data || []).length);

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
query.filter_date, query.startDate, query.endDate
    ]);


    //   console.log(rawData)

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
        const calculateCount = (list, messagePart) => {
            return list.filter(lead => {
                const msg = lead?.lender_response?.ramFinCorpAllApi?.message || '';
                return msg.trim().includes(messagePart);
            }).length;
        };
        setSummaryMetrics({
            totalLeads: _list.length,
            successCount: calculateCount(_list, 'Attributed Successfully'),
            rejectCount: calculateCount(_list, 'Too many requests'),
            duplicateCount: calculateCount(_list, 'Dedup Fail'),
            invalidDataCount: calculateCount(_list, 'invalid data to get offer for lead')
        });
    }, [query.filter_date, query]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);


    const dynamicMetrics = useMemo(() => {
        return [
            {
                title: "Total Logs",
                value: summaryMetrics.totalLeads,
                icon: "Users", // Must match a key in iconMap in SummaryCards.jsx
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
            {
                title: "Invalid Data",
                value: summaryMetrics.invalidDataCount,
                icon: "ShieldOff",
                color: "text-purple-600",
                bg: "bg-purple-50"
            },
        ];
    }, [summaryMetrics]);

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

        if (query.startDate && query.endDate) {
            const start = new Date(query.startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(query.endDate);
            end.setHours(23, 59, 59, 999);

            list = list.filter(lead => {
                const d = new Date(lead.createdAt);
                return d >= start && d <= end;
            });
        }

        // if (query.status) {
        //   const want = query.status.toLowerCase().trim();

        //   list = list.filter(lead => {
        //     const msg = lead?.lender_response?.ramFinCorpAllApi?.message || '';
        //     const got = msg.toLowerCase().trim();
        //     if (want === 'success') {
        //       return got.includes('success');
        //     }
        //     return got === want;
        //   });
        // }

        // Inside the useMemo hook in Leads.jsx

        if (query.status) {
            const want = query.status.toLowerCase().trim();

            list = list.filter(lead => {
                // Assuming your new statuses come from ramFinCorpAllApi.message
                const msg = lead?.lender_response?.ramFinCorpAllApi?.message || '';
                const got = msg.toLowerCase().trim();

                if (want.includes('success')) { // Check if the desired status contains 'success' (e.g., 'attributed successfully')
                    return got.includes('success');
                }

                // Use exact match for all other specific status messages
                return got === want.toLowerCase().trim();
            });
        }

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
            id: l?.id || 'N/A',
            Name: `${l?.firstName} ${l?.lastName}`,
            Email: l?.email,
            Phone: l.phone,
            salary: l.salary,
            // profession: l.profession,
            pincode: l.pincode,
            // panNumber: l.panNumber,
            // gender: l.gender,
            Status: l.lender_response?.ramFinCorpAllApi?.message || 'N/A',
            // Recevied_offer: l.lender_response?.MoneyView?.data?.resData?.data?.response?.offerObjects[0]?.loanAmount || 'N/A',
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
            `RF_filtered_leads_export_${date}_${time}.xlsx`
        );
        ToastNotification.success('Exported successfully!');
    };

    const handleEdit = (lead) => {
        navigate(`/rf-logs/${lead.id}`, { state: { lead } });
    };


    console.log(tableData, "tableData")
    return (
        <>
            <Toaster />

            <SummaryCards
                metrics={dynamicMetrics}
                loading={loading}

            />
            <DataTable
                columns={rmLogsColumn({ handleEdit })}
                data={tableData}
                totalDataCount={filteredCount}
                loading={loading}
                onPageChange={onPageChange}
                onSearch={debouncedSearch}
                onRefresh={fetchLeads}
                onExport={handleExport}
                onCreate={() => navigate('/leads/create')}
                createLabel="Add Lead"
                title="RF Logs"

                // Filters
                onFilterByDate={onFilterByDate}
                activeFilter={query.filter_date}
                onFilterByRange={onFilterByRange}
                activeDateRange={{ startDate: query.startDate, endDate: query.endDate }}

               // STATUS FILTER (Using the new dynamic props)
                onStatusFilterChange={handleStatusFilter} // Use the standard dynamic handler name
                statusFilterOptions={RM_LOGS_STATUS_OPTIONS} // Pass the dynamic options array
                activeStatusFilter={query.status}
                
                // onFilterChange1={handleStatusFilter}
            />
        </>
    );
};

export default Leads;