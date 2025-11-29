import Api from "../api";


export const getLeads = async (pageNo, limit, globalFilter) => {
    return Api().get(`/leads`,
        {
            skipAdminAppend: true,
        }
    )
};
export const getIvrLogs = async ({
    type,
    fromDate,
    toDate,
    perPage = 10,
    currentPage = 1,
    status = '',
    search = '',
}) => {
    return Api().get(`/leads/mv-success-leads`,
        {
            params: {
                type,
                fromDate,
                toDate,
                search,
                perPage,
                currentPage,
                status,
                search
            },
            skipAdminAppend: true,
        }
    )
};
export const getRmLogs = async (
    filterType,
    fromDate,
    toDate
) => {
    return Api().get(`/leads/rm-success-leads`,
        {

            skipAdminAppend: true,
        }
    )
};
export const getOmozingLogs = async (
    filterType,
    fromDate,
    toDate
) => {
    return Api().get(`/leads/omozing-success-leads`,
        {

            skipAdminAppend: true,
        }
    )
};
export const getInAppLeads = async (pageNo, limit, globalFilter) => {
    return Api().get(`/leads/admin/in-app-leads?currentPage=${pageNo}&perPage=${limit}&search=${globalFilter}`,
        {
            skipAdminAppend: true,
        }
    )
};

export const AddLender = async (formData) => {
    console.log(formData, "fffsss")
    return Api().post('/lender', formData);
};

export const getLenderById = async id => Api().get(`/lender/${id}`);

export const UpdateLender = async (id, formData) => {
    return Api().put(`/lender/${id}`, formData);
};
