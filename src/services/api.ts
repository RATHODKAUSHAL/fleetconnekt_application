import { API_BASE_URL } from '@/config';

// Types and endpoints mirror the website client (frontend/lib/api.ts) so both apps speak the same Laravel API.

interface ApiDataResponse<T> {
  message: string;
  data: T;
}

export type CompanyRole = 'owner' | 'admin' | 'dispatcher' | 'viewer';

export interface Service {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export interface ServiceType {
  id: number;
  service_id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Location {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  type: 'country' | 'state' | 'city' | 'locality';
  code: string | null;
  parent?: Location | null;
}

export interface ApiCompany {
  id: number;
  company_uid?: string | null;
  user_id: number;
  name: string;
  slug: string;
  state_id: number | null;
  city_id: number | null;
  locality_id: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_verified: boolean;
  is_active: boolean;
  state?: Location | null;
  city?: Location | null;
  locality?: Location | null;
  services?: Service[];
  service_types?: ServiceType[];
}

export interface MemberCompany {
  company_uid: string;
  name: string;
  slug: string;
  role: CompanyRole;
}

export interface User {
  id: number;
  name: string | null;
  email: string;
  mobile: string | null;
  email_verified_at: string | null;
  companies?: ApiCompany[];
  role?: CompanyRole | null;
  memberships?: MemberCompany[];
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  token_type: 'Bearer';
  token: string;
  user: User;
}

export interface UpdateProfilePayload {
  name?: string | null;
  email?: string;
  mobile?: string | null;
  company?: {
    name: string;
    state_id?: number | null;
    city_id?: number | null;
    locality_id?: number | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
  };
  service_ids?: number[];
  service_types?: number[];
}

export interface CompanyMember {
  uid: string;
  role: CompanyRole;
  is_active: boolean;
  user?: { id: number; name: string | null; email: string; mobile: string | null };
  added_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMemberPayload {
  name: string;
  email: string;
  mobile?: string | null;
  role: Exclude<CompanyRole, 'owner'>;
}

export interface ApiTransporter {
  id: number;
  name: string;
  slug: string;
  phone: string | null;
  is_verified: boolean;
  state: Location | null;
  city: Location | null;
  services?: Service[];
  service_types?: ServiceType[];
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  from?: number | null;
  last_page?: number;
  per_page?: number;
  to?: number | null;
  total?: number;
}

// Paginated Laravel API resource collections keep page details under `meta`.
interface ResourceCollectionResponse<T> {
  data: T[];
  meta: Omit<PaginatedResponse<T>, 'data'>;
}

function flattenResourceCollection<T>(response: ResourceCollectionResponse<T>): PaginatedResponse<T> {
  return { ...response.meta, data: response.data };
}

export type LorryReceiptCopy = 'Consignor copy' | 'Consignee copy' | 'Driver copy' | 'Office copy';
export type LorryReceiptStatus = 'Generated' | 'Printed';

export interface LorryReceipt {
  id: number;
  user_id: number | null;
  lr_number: string;
  lr_date: string | null;
  consignor_name: string | null;
  consignor_gst: string | null;
  consignor_contact: string | null;
  consignor_address: string | null;
  consignor_city: string | null;
  consignor_state: string | null;
  consignor_pin: string | null;
  consignee_name: string | null;
  consignee_gst: string | null;
  consignee_contact: string | null;
  consignee_address: string | null;
  consignee_city: string | null;
  consignee_state: string | null;
  consignee_pin: string | null;
  truck_number: string | null;
  vehicle_type: string | null;
  from: string | null;
  to: string | null;
  driver_name: string | null;
  driver_mobile: string | null;
  driver_license: string | null;
  owner_name: string | null;
  owner_mobile: string | null;
  owner_pan: string | null;
  owner_address: string | null;
  material_name: string | null;
  material_weight: string | null;
  rate: string | number;
  freight_amount: string | number;
  charges: string | number;
  total_amount: string | number;
  advance: string | number;
  balance: string | number;
  copy_type: LorryReceiptCopy;
  share_url: string | null;
  status: LorryReceiptStatus;
  created_at: string;
  updated_at: string;
}

export type LorryReceiptPayload = Omit<LorryReceipt, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export interface CityOption {
  id: number;
  name: string;
  slug: string;
  google_place_id: string | null;
  is_active: boolean;
  state?: { id: number; name: string; code: string | null } | null;
}

export interface CityPayload {
  state_name: string;
  state_code?: string | null;
  name: string;
  google_place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source?: string;
  is_active?: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
export type PaymentType = 'advance' | 'balance' | 'full';
export type PaymentMethod = 'upi' | 'bank_transfer' | 'cheque' | 'cash' | 'other';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overpaid';

export interface BookingPaymentSummary {
  customer_freight: string | null;
  amount_paid: string;
  tds_deducted: string;
  total_settled: string;
  balance_due: string | null;
  payment_status: PaymentStatus;
}

export interface BookingLocation {
  id: number;
  vehicle_number: string | null;
  source: string | null;
  latitude: string | number;
  longitude: string | number;
  place_name: string | null;
  lane_direction: string | null;
  recorded_at: string | null;
}

export interface Booking {
  uid: string;
  booking_number: string;
  company_id: number;
  customer_id: number | null;
  customer?: Customer | null;
  vendor_id: number | null;
  vendor?: Vendor | null;
  origin_city_id: number;
  origin_city?: CityOption | null;
  destination_city_id: number;
  destination_city?: CityOption | null;
  pickup_address: string | null;
  delivery_address: string | null;
  driver_number: string | null;
  vehicle_number: string | null;
  last_location?: BookingLocation | null;
  location_synced_at?: string | null;
  customer_freight: string | number | null;
  payment?: BookingPaymentSummary | null;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  status: BookingStatus;
  customer_reference: string | null;
  remarks: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface BookingPayload {
  // Omit on create to use the company's booking number series.
  booking_number?: string;
  customer_id?: number | null;
  vendor_id?: number | null;
  origin_city_id: number;
  destination_city_id: number;
  pickup_address?: string | null;
  delivery_address?: string | null;
  driver_number?: string | null;
  vehicle_number?: string | null;
  customer_freight?: string | number | null;
  pickup_date?: string | null;
  expected_delivery_date?: string | null;
  status: BookingStatus;
  customer_reference?: string | null;
  remarks?: string | null;
  number_of_trucks?: number;
}

export interface BookingLocationsResponse {
  vehicle_number: string | null;
  location_synced_at: string | null;
  location_sync_error: string | null;
  last_location: BookingLocation | null;
  locations: BookingLocation[];
  new_locations?: number;
}

export interface BookingPayment {
  uid: string;
  customer_id: number | null;
  amount: string;
  tds_amount: string;
  payment_type: PaymentType;
  method: PaymentMethod;
  reference_number: string | null;
  paid_at: string | null;
  notes: string | null;
  recorded_by: number | null;
  is_voided: boolean;
  voided_at: string | null;
  voided_by: number | null;
  void_reason: string | null;
  created_at: string;
}

export interface BookingPaymentsResponse {
  summary: BookingPaymentSummary;
  payments: BookingPayment[];
}

export interface BookingPaymentMutationResponse {
  payment: BookingPayment;
  summary: BookingPaymentSummary;
}

export interface BookingPaymentPayload {
  amount: string;
  tds_amount?: string | null;
  payment_type: PaymentType;
  method: PaymentMethod;
  reference_number?: string | null;
  paid_at: string;
  notes?: string | null;
}

export interface BookingShareLink {
  uid: string;
  label: string | null;
  show_vehicle_number: boolean;
  is_active: boolean;
  expires_at: string;
  revoked_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  created_by: number | null;
  created_at: string;
  url?: string;
}

export interface BookingShareLinkPayload {
  label?: string | null;
  show_vehicle_number?: boolean;
  expires_at?: string | null;
}

export interface BookingNumberSeries {
  configured: boolean;
  prefix: string | null;
  next_number: number | null;
  next_booking_number: string | null;
  digits: number;
  updated_at: string | null;
}

export interface BookingNumberSeriesPayload {
  prefix: string;
  next_number: number;
}

export interface VehicleLocationTxn {
  readerReadTime?: string | null;
  seqNo?: string | null;
  laneDirection?: string | null;
  tollPlazaGeocode?: string | null;
  tollPlazaName?: string | null;
  vehicleType?: string | null;
  vehicleRegNo?: string | null;
}

export interface VehicleLocationResponse {
  response?: {
    response?: {
      vehicle?: {
        vehltxnList?: { txn?: VehicleLocationTxn[] | VehicleLocationTxn | null } | null;
      } | null;
    } | null;
  }[];
}

export interface VehicleDetailsResponse {
  vehicle_number?: string | null;
  fetched_at?: string | null;
  details?: Record<string, unknown> | unknown[] | string | number | boolean | null;
}

export interface Customer {
  id: number;
  uid: string;
  name: string;
  company_name: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerPayload {
  name: string;
  company_name?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
}

export interface Vendor {
  id: number;
  uid: string;
  name: string;
  company_name: string;
  email: string | null;
  mobile: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorPayload {
  name: string;
  company_name: string;
  email?: string | null;
  mobile: string;
  is_active?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string[]> = {},
    public retryAfter?: number,
  ) {
    super(message);
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** Called when an authenticated request comes back 401, so the session can be cleared. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Could not reach the server. Check your internet connection and try again.', 0);
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) unauthorizedHandler?.();
    const errors = (payload.errors ?? {}) as Record<string, string[]>;
    const firstError = Object.values(errors).flat()[0];
    throw new ApiError(
      (typeof firstError === 'string' ? firstError : undefined) ?? payload.message ?? 'Something went wrong. Please try again.',
      response.status,
      errors,
      payload.retry_after ?? payload.errors?.retry_after,
    );
  }

  return payload as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

function query(params: Record<string, string | number | undefined | null>) {
  const search = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value).trim())}`)
    .join('&');
  return search ? `?${search}` : '';
}

export const authApi = {
  requestOtp(email: string, purpose: 'login' | 'register') {
    const path = purpose === 'register' ? '/auth/register/otp/request' : '/auth/otp/request';
    return apiRequest<{ message: string }>(path, json('POST', { email }));
  },

  verifyOtp(email: string, otp: string, purpose: 'login' | 'register') {
    const path = purpose === 'register' ? '/auth/register/otp/verify' : '/auth/otp/verify';
    return apiRequest<ApiDataResponse<AuthResult>>(
      path,
      json('POST', { email, otp, device_name: 'FleetConnekt app' }),
    ).then((response) => response.data);
  },

  getUser(token: string) {
    return apiRequest<ApiDataResponse<User>>('/v1/user', {}, token).then((response) => response.data);
  },

  updateProfile(token: string, payload: UpdateProfilePayload) {
    return apiRequest<ApiDataResponse<User>>('/v1/update-profile', json('PUT', payload), token).then(
      (response) => response.data,
    );
  },

  logout(token: string) {
    return apiRequest<{ message: string }>('/auth/logout', json('POST'), token);
  },
};

export const publicApi = {
  home() {
    return apiRequest<ApiDataResponse<{ featured_transporters: ApiTransporter[] }>>('/v1/home').then(
      (response) => response.data,
    );
  },

  featuredCities() {
    return apiRequest<ApiDataResponse<Location[]>>('/v1/cities?show_on_frontend=1').then((response) => response.data);
  },

  searchStates(search: string) {
    return apiRequest<ApiDataResponse<Location[]>>(`/v1/states${query({ search })}`).then((response) => response.data);
  },

  searchCities(stateId: number, search: string) {
    return apiRequest<ApiDataResponse<Location[]>>(`/v1/cities/${stateId}${query({ search })}`).then(
      (response) => response.data,
    );
  },

  services() {
    return apiRequest<ApiDataResponse<{ services: Service[] }>>('/v1/services').then((response) => response.data.services);
  },

  serviceTypes() {
    return apiRequest<ApiDataResponse<{ service_types: ServiceType[] }>>('/v1/service-types').then(
      (response) => response.data.service_types,
    );
  },
};

export const lrApi = {
  list(token: string) {
    return apiRequest<ApiDataResponse<PaginatedResponse<LorryReceipt>>>('/v1/lrs', {}, token).then(
      (response) => response.data.data,
    );
  },

  create(token: string, payload: LorryReceiptPayload) {
    return apiRequest<ApiDataResponse<LorryReceipt>>('/v1/lrs', json('POST', payload), token).then(
      (response) => response.data,
    );
  },

  update(token: string, id: number, payload: LorryReceiptPayload) {
    return apiRequest<ApiDataResponse<LorryReceipt>>(`/v1/lrs/${id}`, json('PUT', payload), token).then(
      (response) => response.data,
    );
  },

  delete(token: string, id: number) {
    return apiRequest<void>(`/v1/lrs/${id}`, json('DELETE'), token);
  },
};

export const cityApi = {
  search(token: string, search: string) {
    return apiRequest<ApiDataResponse<CityOption[]>>(`/v1/cities/search${query({ search })}`, {}, token).then(
      (response) => response.data,
    );
  },

  create(token: string, payload: CityPayload) {
    return apiRequest<ApiDataResponse<CityOption>>('/v1/cities', json('POST', payload), token).then(
      (response) => response.data,
    );
  },
};

type CompanyKey = string | number;

const companyPath = (company: CompanyKey, path: string) => `/v1/companies/${company}${path}`;

export const bookingNumberSeriesApi = {
  get(token: string, company: CompanyKey) {
    return apiRequest<ApiDataResponse<BookingNumberSeries>>(companyPath(company, '/booking-number-series'), {}, token).then(
      (response) => response.data,
    );
  },

  update(token: string, company: CompanyKey, payload: BookingNumberSeriesPayload) {
    return apiRequest<ApiDataResponse<BookingNumberSeries>>(
      companyPath(company, '/booking-number-series'),
      json('PUT', payload),
      token,
    ).then((response) => response.data);
  },
};

export const bookingApi = {
  list(
    token: string,
    company: CompanyKey,
    params: { page?: number; perPage?: number; search?: string; paymentStatus?: PaymentStatus | null } = {},
  ) {
    const suffix = query({
      page: params.page,
      per_page: params.perPage,
      search: params.search,
      payment_status: params.paymentStatus,
    });
    return apiRequest<ApiDataResponse<ResourceCollectionResponse<Booking>>>(
      companyPath(company, `/bookings${suffix}`),
      {},
      token,
    ).then((response) => flattenResourceCollection(response.data));
  },

  get(token: string, company: CompanyKey, uid: string) {
    return apiRequest<ApiDataResponse<Booking>>(companyPath(company, `/bookings/${uid}`), {}, token).then(
      (response) => response.data,
    );
  },

  create(token: string, company: CompanyKey, payload: BookingPayload) {
    return apiRequest<ApiDataResponse<Booking | Booking[]>>(companyPath(company, '/bookings'), json('POST', payload), token).then(
      (response) => response.data,
    );
  },

  update(token: string, company: CompanyKey, uid: string, payload: BookingPayload) {
    const { number_of_trucks: _ignored, ...updatePayload } = payload;
    return apiRequest<ApiDataResponse<Booking>>(
      companyPath(company, `/bookings/${uid}`),
      json('PUT', updatePayload),
      token,
    ).then((response) => response.data);
  },

  delete(token: string, company: CompanyKey, uid: string) {
    return apiRequest<void>(companyPath(company, `/bookings/${uid}`), json('DELETE'), token);
  },

  locations(token: string, company: CompanyKey, uid: string) {
    return apiRequest<ApiDataResponse<BookingLocationsResponse>>(
      companyPath(company, `/bookings/${uid}/locations`),
      {},
      token,
    ).then((response) => response.data);
  },

  refreshLocations(token: string, company: CompanyKey, uid: string) {
    return apiRequest<ApiDataResponse<BookingLocationsResponse>>(
      companyPath(company, `/bookings/${uid}/locations/refresh`),
      json('POST'),
      token,
    ).then((response) => response.data);
  },

  payments(token: string, company: CompanyKey, uid: string) {
    return apiRequest<ApiDataResponse<BookingPaymentsResponse>>(
      companyPath(company, `/bookings/${uid}/payments`),
      {},
      token,
    ).then((response) => response.data);
  },

  recordPayment(token: string, company: CompanyKey, uid: string, payload: BookingPaymentPayload) {
    return apiRequest<ApiDataResponse<BookingPaymentMutationResponse>>(
      companyPath(company, `/bookings/${uid}/payments`),
      json('POST', payload),
      token,
    ).then((response) => response.data);
  },

  voidPayment(token: string, company: CompanyKey, uid: string, paymentUid: string, reason: string) {
    return apiRequest<ApiDataResponse<BookingPaymentMutationResponse>>(
      companyPath(company, `/bookings/${uid}/payments/${paymentUid}/void`),
      json('POST', { reason }),
      token,
    ).then((response) => response.data);
  },

  shareLinks(token: string, company: CompanyKey, uid: string) {
    return apiRequest<ApiDataResponse<BookingShareLink[]>>(
      companyPath(company, `/bookings/${uid}/share-links`),
      {},
      token,
    ).then((response) => response.data);
  },

  createShareLink(token: string, company: CompanyKey, uid: string, payload: BookingShareLinkPayload) {
    return apiRequest<ApiDataResponse<BookingShareLink>>(
      companyPath(company, `/bookings/${uid}/share-links`),
      json('POST', payload),
      token,
    ).then((response) => response.data);
  },
};

export const vehicleLocationApi = {
  show(token: string, vehicleNumber: string) {
    return apiRequest<ApiDataResponse<VehicleLocationResponse>>(
      '/v1/vehicle-location',
      json('POST', { vehicle_number: vehicleNumber }),
      token,
    ).then((response) => response.data);
  },
};

export const vehicleDetailsApi = {
  show(token: string, vehicleNumber: string) {
    return apiRequest<ApiDataResponse<VehicleDetailsResponse>>(
      '/v1/vehicle-details',
      json('POST', { vehicle_number: vehicleNumber }),
      token,
    ).then((response) => response.data);
  },
};

export const customerApi = {
  list(token: string, company: CompanyKey, search = '') {
    return apiRequest<ApiDataResponse<PaginatedResponse<Customer>>>(
      companyPath(company, `/customers${query({ search, per_page: 100 })}`),
      {},
      token,
    ).then((response) => response.data.data);
  },

  get(token: string, company: CompanyKey, uid: string) {
    return apiRequest<ApiDataResponse<Customer>>(companyPath(company, `/customers/${uid}`), {}, token).then(
      (response) => response.data,
    );
  },

  create(token: string, company: CompanyKey, payload: CustomerPayload) {
    return apiRequest<ApiDataResponse<Customer>>(companyPath(company, '/customers'), json('POST', payload), token).then(
      (response) => response.data,
    );
  },

  update(token: string, company: CompanyKey, uid: string, payload: CustomerPayload) {
    return apiRequest<ApiDataResponse<Customer>>(
      companyPath(company, `/customers/${uid}`),
      json('PUT', payload),
      token,
    ).then((response) => response.data);
  },

  delete(token: string, company: CompanyKey, uid: string) {
    return apiRequest<void>(companyPath(company, `/customers/${uid}`), json('DELETE'), token);
  },
};

export const vendorApi = {
  list(token: string, company: CompanyKey, search = '') {
    return apiRequest<ApiDataResponse<PaginatedResponse<Vendor>>>(
      companyPath(company, `/vendors${query({ search, per_page: 100 })}`),
      {},
      token,
    ).then((response) => response.data.data);
  },

  get(token: string, company: CompanyKey, uid: string) {
    return apiRequest<ApiDataResponse<Vendor>>(companyPath(company, `/vendors/${uid}`), {}, token).then(
      (response) => response.data,
    );
  },

  create(token: string, company: CompanyKey, payload: VendorPayload) {
    return apiRequest<ApiDataResponse<Vendor>>(companyPath(company, '/vendors'), json('POST', payload), token).then(
      (response) => response.data,
    );
  },

  update(token: string, company: CompanyKey, uid: string, payload: VendorPayload) {
    return apiRequest<ApiDataResponse<Vendor>>(companyPath(company, `/vendors/${uid}`), json('PUT', payload), token).then(
      (response) => response.data,
    );
  },

  delete(token: string, company: CompanyKey, uid: string) {
    return apiRequest<void>(companyPath(company, `/vendors/${uid}`), json('DELETE'), token);
  },
};

export const teamApi = {
  list(token: string, company: CompanyKey) {
    return apiRequest<ApiDataResponse<CompanyMember[]>>(companyPath(company, '/teams'), {}, token).then(
      (response) => response.data,
    );
  },

  create(token: string, company: CompanyKey, payload: CompanyMemberPayload) {
    return apiRequest<ApiDataResponse<CompanyMember>>(companyPath(company, '/teams'), json('POST', payload), token).then(
      (response) => response.data,
    );
  },
};

export function errorMessage(issue: unknown, fallback = 'Something went wrong. Please try again.') {
  if (issue instanceof ApiError) {
    return issue.retryAfter ? `${issue.message} Try again in ${issue.retryAfter} seconds.` : issue.message;
  }
  return fallback;
}

/** First server validation message per field, keyed the way Laravel returns them (e.g. "company.name"). */
export function fieldErrorsFrom(issue: unknown): Record<string, string> {
  if (!(issue instanceof ApiError)) return {};
  return Object.fromEntries(
    Object.entries(issue.errors)
      .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
      .map(([key, messages]) => [key, messages[0]]),
  );
}
