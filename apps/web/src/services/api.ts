import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAccessToken } from '../auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: async (headers) => {
      const token = await getAccessToken();
      if (token) {
        const clean = String(token).replace(/[\r\n\s]+/g, '');
        if (clean) headers.set('Authorization', `Bearer ${clean}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Incident', 'ServiceRequest', 'CatalogItem', 'Problem', 'Change', 'CI', 'CIType',
    'KbArticle', 'Sla', 'Event', 'Availability', 'Capacity', 'Release', 'Asset',
    'Continuity', 'Supplier', 'Financial', 'Notification', 'Approval', 'User', 'Group', 'Role',
  ],
  endpoints: (b) => ({
    me: b.query<any, void>({ query: () => '/users/me' }),
    overview: b.query<any, void>({ query: () => '/dashboards/overview' }),
    incidentsByPriority: b.query<any, void>({ query: () => '/dashboards/incidents-by-priority' }),
    changesByStatus: b.query<any, void>({ query: () => '/dashboards/changes-by-status' }),
    notifications: b.query<any[], void>({ query: () => '/notifications/me', providesTags: ['Notification'] }),
    markNotificationRead: b.mutation<any, string>({ query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }), invalidatesTags: ['Notification'] }),
    myApprovals: b.query<any[], void>({ query: () => '/approvals/mine', providesTags: ['Approval'] }),
    decideApproval: b.mutation<any, { id: string; decision: 'approved' | 'rejected'; comment?: string }>({
      query: ({ id, ...body }) => ({ url: `/approvals/${id}/decide`, method: 'POST', body }), invalidatesTags: ['Approval', 'Change', 'ServiceRequest'],
    }),

    incidents: b.query<any, any>({ query: (p) => ({ url: '/incidents', params: p }), providesTags: ['Incident'] }),
    incident: b.query<any, string>({ query: (id) => `/incidents/${id}`, providesTags: (_r, _e, id) => [{ type: 'Incident', id }] }),
    createIncident: b.mutation<any, any>({ query: (body) => ({ url: '/incidents', method: 'POST', body }), invalidatesTags: ['Incident'] }),
    updateIncident: b.mutation<any, { id: string; body: any }>({ query: ({ id, body }) => ({ url: `/incidents/${id}`, method: 'PATCH', body }), invalidatesTags: ['Incident'] }),
    resolveIncident: b.mutation<any, { id: string; resolution: string; resolutionCode?: string }>({
      query: ({ id, ...body }) => ({ url: `/incidents/${id}/resolve`, method: 'POST', body }), invalidatesTags: ['Incident'],
    }),
    closeIncident: b.mutation<any, string>({ query: (id) => ({ url: `/incidents/${id}/close`, method: 'POST' }), invalidatesTags: ['Incident'] }),
    incidentWorklog: b.query<any[], string>({ query: (id) => `/incidents/${id}/worklog` }),
    addIncidentWorklog: b.mutation<any, { id: string; body: string; visibility?: string }>({
      query: ({ id, ...body }) => ({ url: `/incidents/${id}/worklog`, method: 'POST', body }), invalidatesTags: ['Incident'],
    }),

    serviceRequests: b.query<any, any>({ query: (p) => ({ url: '/service-requests', params: p }), providesTags: ['ServiceRequest'] }),
    serviceRequest: b.query<any, string>({ query: (id) => `/service-requests/${id}` }),
    createServiceRequest: b.mutation<any, any>({ query: (body) => ({ url: '/service-requests', method: 'POST', body }), invalidatesTags: ['ServiceRequest'] }),
    completeFulfilmentTask: b.mutation<any, string>({ query: (taskId) => ({ url: `/service-requests/tasks/${taskId}/complete`, method: 'PATCH' }), invalidatesTags: ['ServiceRequest'] }),

    catalogItems: b.query<any[], any>({ query: (p) => ({ url: '/catalog/items', params: p }), providesTags: ['CatalogItem'] }),
    catalogItem: b.query<any, string>({ query: (id) => `/catalog/items/${id}` }),
    catalogCategories: b.query<any[], void>({ query: () => '/catalog/categories' }),

    problems: b.query<any[], any>({ query: (p) => ({ url: '/problems', params: p }), providesTags: ['Problem'] }),
    problem: b.query<any, string>({ query: (id) => `/problems/${id}` }),
    createProblem: b.mutation<any, any>({ query: (body) => ({ url: '/problems', method: 'POST', body }), invalidatesTags: ['Problem'] }),

    changes: b.query<any, any>({ query: (p) => ({ url: '/changes', params: p }), providesTags: ['Change'] }),
    change: b.query<any, string>({ query: (id) => `/changes/${id}` }),
    createChange: b.mutation<any, any>({ query: (body) => ({ url: '/changes', method: 'POST', body }), invalidatesTags: ['Change'] }),
    updateChange: b.mutation<any, { id: string; body: any }>({ query: ({ id, body }) => ({ url: `/changes/${id}`, method: 'PATCH', body }), invalidatesTags: ['Change'] }),
    submitCab: b.mutation<any, { id: string; approvers: any[] }>({
      query: ({ id, approvers }) => ({ url: `/changes/${id}/submit-cab`, method: 'POST', body: { approvers } }), invalidatesTags: ['Change'],
    }),
    changeCalendar: b.query<any[], { from: string; to: string }>({ query: (p) => ({ url: '/changes/calendar', params: p }) }),

    cis: b.query<any[], any>({ query: (p) => ({ url: '/cmdb/cis', params: p }), providesTags: ['CI'] }),
    ci: b.query<any, string>({ query: (id) => `/cmdb/cis/${id}` }),
    createCi: b.mutation<any, any>({ query: (body) => ({ url: '/cmdb/cis', method: 'POST', body }), invalidatesTags: ['CI'] }),
    ciTypes: b.query<any[], void>({ query: () => '/cmdb/ci-types', providesTags: ['CIType'] }),
    ciImpact: b.query<any, { id: string; depth?: number }>({ query: ({ id, depth = 3 }) => ({ url: `/cmdb/cis/${id}/impact`, params: { depth } }) }),

    kbArticles: b.query<any[], any>({ query: (p) => ({ url: '/knowledge', params: p }), providesTags: ['KbArticle'] }),
    kbArticle: b.query<any, string>({ query: (id) => `/knowledge/${id}` }),
    createKbArticle: b.mutation<any, any>({ query: (body) => ({ url: '/knowledge', method: 'POST', body }), invalidatesTags: ['KbArticle'] }),
    publishKbArticle: b.mutation<any, string>({ query: (id) => ({ url: `/knowledge/${id}/publish`, method: 'POST' }), invalidatesTags: ['KbArticle'] }),

    slas: b.query<any[], void>({ query: () => '/sla', providesTags: ['Sla'] }),
    slaBreaches: b.query<any[], void>({ query: () => '/sla/breaches' }),

    events: b.query<any[], any>({ query: (p) => ({ url: '/events', params: p }), providesTags: ['Event'] }),
    eventRules: b.query<any[], void>({ query: () => '/events/rules' }),

    availabilityPlans: b.query<any[], void>({ query: () => '/availability/plans', providesTags: ['Availability'] }),
    outages: b.query<any[], void>({ query: () => '/availability/outages' }),
    capacityPlans: b.query<any[], void>({ query: () => '/capacity/plans', providesTags: ['Capacity'] }),

    releases: b.query<any[], any>({ query: (p) => ({ url: '/releases', params: p }), providesTags: ['Release'] }),
    release: b.query<any, string>({ query: (id) => `/releases/${id}` }),
    createRelease: b.mutation<any, any>({ query: (body) => ({ url: '/releases', method: 'POST', body }), invalidatesTags: ['Release'] }),

    assets: b.query<any[], any>({ query: (p) => ({ url: '/assets', params: p }), providesTags: ['Asset'] }),
    asset: b.query<any, string>({ query: (id) => `/assets/${id}` }),
    createAsset: b.mutation<any, any>({ query: (body) => ({ url: '/assets', method: 'POST', body }), invalidatesTags: ['Asset'] }),

    continuityPlans: b.query<any[], void>({ query: () => '/continuity/plans', providesTags: ['Continuity'] }),
    suppliers: b.query<any[], void>({ query: () => '/suppliers', providesTags: ['Supplier'] }),
    supplier: b.query<any, string>({ query: (id) => `/suppliers/${id}` }),

    chargeback: b.query<any[], string>({ query: (fy) => `/financial/chargeback/${fy}` }),
    costCenters: b.query<any[], void>({ query: () => '/financial/cost-centers', providesTags: ['Financial'] }),
  }),
});

export const {
  useMeQuery, useOverviewQuery, useIncidentsByPriorityQuery, useChangesByStatusQuery,
  useNotificationsQuery, useMarkNotificationReadMutation,
  useMyApprovalsQuery, useDecideApprovalMutation,
  useIncidentsQuery, useIncidentQuery, useCreateIncidentMutation, useUpdateIncidentMutation,
  useResolveIncidentMutation, useCloseIncidentMutation,
  useIncidentWorklogQuery, useAddIncidentWorklogMutation,
  useServiceRequestsQuery, useServiceRequestQuery, useCreateServiceRequestMutation, useCompleteFulfilmentTaskMutation,
  useCatalogItemsQuery, useCatalogItemQuery, useCatalogCategoriesQuery,
  useProblemsQuery, useProblemQuery, useCreateProblemMutation,
  useChangesQuery, useChangeQuery, useCreateChangeMutation, useUpdateChangeMutation, useSubmitCabMutation, useChangeCalendarQuery,
  useCisQuery, useCiQuery, useCreateCiMutation, useCiTypesQuery, useCiImpactQuery,
  useKbArticlesQuery, useKbArticleQuery, useCreateKbArticleMutation, usePublishKbArticleMutation,
  useSlasQuery, useSlaBreachesQuery,
  useEventsQuery, useEventRulesQuery,
  useAvailabilityPlansQuery, useOutagesQuery,
  useCapacityPlansQuery,
  useReleasesQuery, useReleaseQuery, useCreateReleaseMutation,
  useAssetsQuery, useAssetQuery, useCreateAssetMutation,
  useContinuityPlansQuery, useSuppliersQuery, useSupplierQuery,
  useChargebackQuery, useCostCentersQuery,
} = api;
