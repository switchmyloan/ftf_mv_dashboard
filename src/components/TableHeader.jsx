import { Edit2, Image, Trash2, Eye } from 'lucide-react';
const S3_IMAGE_PATH = import.meta.env.VITE_IMAGE_URL

export const lenderColumn = ({ handleEdit, handleDelete }) => [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Min Amount',
    accessorKey: 'minimumLoanAmount',
    cell: ({ getValue }) => {
      const income = getValue();

      if (income === null || income === undefined || isNaN(income)) {
        return 'N/A';
      }

      const formattedIncome = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(income);

      return formattedIncome;
    },
  },
  {
    header: 'Max Amount',
    accessorKey: 'maximumLoanAmount',
    cell: ({ getValue }) => {
      const income = getValue();

      if (income === null || income === undefined || isNaN(income)) {
        return 'N/A';
      }

      const formattedIncome = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(income);

      return formattedIncome;
    },
  },
  {
    header: 'Min Tenure',
    accessorKey: 'minimumTenure',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Max Tenure',
    accessorKey: 'maximumTenure',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Rate',
    accessorKey: 'startingInterestRate',
    cell: ({ getValue }) => getValue() || 'N/A',
  },


  {
    header: 'Status',
    accessorKey: 'isActive',
    cell: ({ getValue }) => {
      const isActive = getValue(); // This returns a boolean: true or false

      // Determine the text and badge color based on the boolean value
      const statusText = isActive ? 'Active' : 'Inactive';
      const badgeColorClass = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

      return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${badgeColorClass}`}>
          {statusText}
        </span>
      );
    },
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }) => {
      return (
        <div className="flex space-x-3">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition"
          >
            <Edit2 size={20} />
          </button>
          {/* <button
            onClick={() => handleDelete(row.original.id)}
            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition"
          >
            <Trash2 size={20} />
          </button> */}
        </div>
      );
    },
  },
];
export const leadsColumn = ({ handleEdit, handleDelete }) => [
  {
  header: 'SN', // Serial Number
  id: 'sn',
  enableSorting: false, // Serial numbers shouldn't be sortable
  maxSize: 50,
  cell: ({ row, table }) => {
    // 1. Get current pagination state from the table instance
    const { pageIndex, pageSize } = table.getState().pagination;
    
    // 2. Calculate the global row index
    // Formula: (Current Page Index * Page Size) + Row Index on current page + 1
    return (pageIndex * pageSize) + row.index + 1;
  },
},
  {
    header: 'Full Name',
    id: 'fullName',
    maxSize: 100, 
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ getValue }) => {
      const fullName = getValue();
      
      return (
        // Apply classes to handle long names
        <div className="w-full overflow-hidden whitespace-normal">
          {fullName.trim() || 'N/A'}
        </div>
      );
    },
  },
//  {
//   header: 'MoneyView Msg',
//   id: 'moneyViewMsg',
//   accessorKey: 'lender_response',
//   cell: ({ row }) => {
//     const message = row.original.lender_response?.MoneyView?.message;
//     if (!message) {
//       return <span className="text-gray-500">N/A</span>;
//     }
//     if (message.includes('Lead has been rejected')) {
//       return (
//         <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
//           {message}
//         </span>
//       );
//     }
//     if (message.includes('Duplicate User (Dedupe)')) {
//       return (
//         <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
//           {message}
//         </span>
//       );
//     }
//     return (
//       <span className="text-gray-800">
//         {message}
//       </span>
//     );
//   },
// },
{
  header: 'MoneyView Msg',
  id: 'moneyViewMsg',
  accessorKey: 'lender_response',
  cell: ({ row }) => {
    const message = row.original.lender_response?.MoneyView?.message;
    if (!message) {
      return <span className="text-gray-500">N/A</span>;
    }
    
    // Red Chip for Rejected Lead
    if (message.includes('Lead has been rejected')) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
          {message}
        </span>
      );
    }
    
    // Yellow Chip for Duplicate User
    if (message.includes('Duplicate User (Dedupe)')) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
          {message}
        </span>
      );
    }
    if (message.includes('Invalid data to get offer for lead')) {
      return (
        <span className="inline-flex items-center rounded-full bg-orange-200 px-2 py-1 text-xs font-medium text-orange-800">
          {message}
        </span>
      );
    }
    
    // Green Chip for all other messages (Success/Generic)
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        {message}
      </span>
    );
  },
},
  {
    header: 'Number',
    accessorKey: 'phone',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Pan Card',
    accessorKey: 'panNumber',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Salary',
    accessorKey: 'salary',
    cell: ({ getValue }) => {
      const income = getValue();

      if (income === null || income === undefined || isNaN(income)) {
        return 'N/A';
      }

      const formattedIncome = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(income);

      return formattedIncome;
    },
  },
  {
    header: 'DOB',
    accessorKey: 'dob',
    cell: ({ getValue }) => {
      const dateStr = getValue();
      if (!dateStr) {
        return 'N/A';
      }

      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    },
  },
 {
  header: 'Created',
  accessorKey: 'createdAt',
  cell: ({ getValue }) => {
    const timestamp = getValue();
    
    if (timestamp && typeof timestamp === 'string' && timestamp.length >= 10) {
      // Get the first 10 characters (YYYY-MM-DD)
      return timestamp.substring(0, 10);
    }
    
    return timestamp || 'N/A';
  },
},
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }) => {
      return (
        <div className="flex space-x-3">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition"
          >
            <Eye size={20} />
          </button>
        </div>
      );
    },
  },
];
export const ivrLogsColumn = ({ handleEdit, handleDelete }) => [
  {
  header: 'SN', // Serial Number
  id: 'sn',
  enableSorting: false, // Serial numbers shouldn't be sortable
  maxSize: 50,
  cell: ({ row, table }) => {
    // 1. Get current pagination state from the table instance
    const { pageIndex, pageSize } = table.getState().pagination;
    
    // 2. Calculate the global row index
    // Formula: (Current Page Index * Page Size) + Row Index on current page + 1
    return (pageIndex * pageSize) + row.index + 1;
  },
},
  {
    header: 'Full Name',
    id: 'fullName',
    maxSize: 100, 
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ getValue }) => {
      const fullName = getValue();
      
      return (
        // Apply classes to handle long names
        <div className="w-full overflow-hidden whitespace-normal">
          {fullName.trim() || 'N/A'}
        </div>
      );
    },
  },
//  {
//   header: 'MoneyView Msg',
//   id: 'moneyViewMsg',
//   accessorKey: 'lender_response',
//   cell: ({ row }) => {
//     const message = row.original.lender_response?.MoneyView?.message;
//     if (!message) {
//       return <span className="text-gray-500">N/A</span>;
//     }
//     if (message.includes('Lead has been rejected')) {
//       return (
//         <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
//           {message}
//         </span>
//       );
//     }
//     if (message.includes('Duplicate User (Dedupe)')) {
//       return (
//         <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
//           {message}
//         </span>
//       );
//     }
//     return (
//       <span className="text-gray-800">
//         {message}
//       </span>
//     );
//   },
// },
{
  header: 'MoneyView Msg',
  id: 'moneyViewMsg',
  accessorKey: 'lender_response',
  cell: ({ row }) => {
    const message = row.original.lender_response?.MoneyView?.message;
    if (!message) {
      return <span className="text-gray-500">N/A</span>;
    }
    
    // Red Chip for Rejected Lead
    if (message.includes('Lead has been rejected')) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
          {message}
        </span>
      );
    }
    
    // Yellow Chip for Duplicate User
    if (message.includes('Duplicate User (Dedupe)')) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
          {message}
        </span>
      );
    }
    if (message.includes('Invalid data to get offer for lead')) {
      return (
        <span className="inline-flex items-center rounded-full bg-orange-200 px-2 py-1 text-xs font-medium text-orange-800">
          {message}
        </span>
      );
    }
    
    // Green Chip for all other messages (Success/Generic)
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        {message}
      </span>
    );
  },
},
  {
    header: 'Number',
    accessorKey: 'phone',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Pan Card',
    accessorKey: 'panNumber',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Salary',
    accessorKey: 'salary',
    cell: ({ getValue }) => {
      const income = getValue();

      if (income === null || income === undefined || isNaN(income)) {
        return 'N/A';
      }

      const formattedIncome = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(income);

      return formattedIncome;
    },
  },
  
 {
  header: 'Created',
  accessorKey: 'createdAt',
  cell: ({ getValue }) => {
    const timestamp = getValue();
    
    if (timestamp && typeof timestamp === 'string' && timestamp.length >= 10) {
      // Get the first 10 characters (YYYY-MM-DD)
      return timestamp.substring(0, 10);
    }
    
    return timestamp || 'N/A';
  },
},
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }) => {
      return (
        <div className="flex space-x-3">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition"
          >
            <Eye size={20} />
          </button>
        </div>
      );
    },
  },
];
export const rmLogsColumn = ({ handleEdit, handleDelete }) => [
  {
  header: 'SN', // Serial Number
  id: 'sn',
  enableSorting: false, // Serial numbers shouldn't be sortable
  maxSize: 50,
  cell: ({ row, table }) => {
    // 1. Get current pagination state from the table instance
    const { pageIndex, pageSize } = table.getState().pagination;
    
    // 2. Calculate the global row index
    // Formula: (Current Page Index * Page Size) + Row Index on current page + 1
    return (pageIndex * pageSize) + row.index + 1;
  },
},
  {
    header: 'Full Name',
    id: 'fullName',
    maxSize: 100, 
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ getValue }) => {
      const fullName = getValue();
      
      return (
        // Apply classes to handle long names
        <div className="w-full overflow-hidden whitespace-normal">
          {fullName.trim() || 'N/A'}
        </div>
      );
    },
  },
{
  header: 'MoneyView Msg',
  id: 'moneyViewMsg',
  accessorKey: 'lender_response',
  cell: ({ row }) => {
    const message = row.original.lender_response?.ramFinCorpAllApi?.message;
    if (!message) {
      return <span className="text-gray-500">N/A</span>;
    }
    
    // Red Chip for Rejected Lead
    if (message.includes('Lead has been rejected')) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
          {message}
        </span>
      );
    }
    
    // Yellow Chip for Duplicate User
    if (message.includes('Dedup Fail')) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
          {message}
        </span>
      );
    }
    if (message.includes('Too many requests, please try again later.')) {
      return (
        <span className="inline-flex items-center rounded-full bg-orange-200 px-2 py-1 text-xs font-medium text-orange-800">
          {message}
        </span>
      );
    }
    
    // Green Chip for all other messages (Success/Generic)
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        {message}
      </span>
    );
  },
},
  {
    header: 'Number',
    accessorKey: 'phone',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Pan Card',
    accessorKey: 'panNumber',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Salary',
    accessorKey: 'salary',
    cell: ({ getValue }) => {
      const income = getValue();

      if (income === null || income === undefined || isNaN(income)) {
        return 'N/A';
      }

      const formattedIncome = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(income);

      return formattedIncome;
    },
  },
  
 {
  header: 'Created',
  accessorKey: 'createdAt',
  cell: ({ getValue }) => {
    const timestamp = getValue();
    
    if (timestamp && typeof timestamp === 'string' && timestamp.length >= 10) {
      // Get the first 10 characters (YYYY-MM-DD)
      return timestamp.substring(0, 10);
    }
    
    return timestamp || 'N/A';
  },
},
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }) => {
      return (
        <div className="flex space-x-3">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition"
          >
            <Eye size={20} />
          </button>
        </div>
      );
    },
  },
];
export const omozingLogsColumn = ({ handleEdit, handleDelete }) => [
  {
  header: 'SN', // Serial Number
  id: 'sn',
  enableSorting: false, // Serial numbers shouldn't be sortable
  maxSize: 50,
  cell: ({ row, table }) => {
    // 1. Get current pagination state from the table instance
    const { pageIndex, pageSize } = table.getState().pagination;
    
    // 2. Calculate the global row index
    // Formula: (Current Page Index * Page Size) + Row Index on current page + 1
    return (pageIndex * pageSize) + row.index + 1;
  },
},
  {
    header: 'Full Name',
    id: 'fullName',
    maxSize: 100, 
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ getValue }) => {
      const fullName = getValue();
      
      return (
        // Apply classes to handle long names
        <div className="w-full overflow-hidden whitespace-normal">
          {fullName.trim() || 'N/A'}
        </div>
      );
    },
  },
{
  header: 'MoneyView Msg',
  id: 'moneyViewMsg',
  accessorKey: 'lender_response',
  cell: ({ row }) => {
    const message = row.original.lender_response?.omozing?.message;
    if (!message) {
      return <span className="text-gray-500">N/A</span>;
    }
    
    // Red Chip for Rejected Lead
    if (message.includes('Lead has been rejected')) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
          {message}
        </span>
      );
    }
    
    // Yellow Chip for Duplicate User
    if (message.includes('Dedup Fail')) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
          {message}
        </span>
      );
    }
    if (message.includes('Too many requests, please try again later.')) {
      return (
        <span className="inline-flex items-center rounded-full bg-orange-200 px-2 py-1 text-xs font-medium text-orange-800">
          {message}
        </span>
      );
    }
    
    // Green Chip for all other messages (Success/Generic)
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        {message}
      </span>
    );
  },
},
  {
    header: 'Number',
    accessorKey: 'phone',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Pan Card',
    accessorKey: 'panNumber',
    cell: ({ getValue }) => getValue() || 'N/A',
  },
  {
    header: 'Salary',
    accessorKey: 'salary',
    cell: ({ getValue }) => {
      const income = getValue();

      if (income === null || income === undefined || isNaN(income)) {
        return 'N/A';
      }

      const formattedIncome = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(income);

      return formattedIncome;
    },
  },
  
 {
  header: 'Created',
  accessorKey: 'createdAt',
  cell: ({ getValue }) => {
    const timestamp = getValue();
    
    if (timestamp && typeof timestamp === 'string' && timestamp.length >= 10) {
      // Get the first 10 characters (YYYY-MM-DD)
      return timestamp.substring(0, 10);
    }
    
    return timestamp || 'N/A';
  },
},
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: ({ row }) => {
      return (
        <div className="flex space-x-3">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition"
          >
            <Eye size={20} />
          </button>
        </div>
      );
    },
  },
];

