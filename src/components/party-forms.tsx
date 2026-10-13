import { Pressable, Switch, Text, View } from 'react-native';

import { Field, ORANGE, Section } from '@/components/ui';
import { EMAIL_PATTERN, PHONE_PATTERN } from '@/lib/format';
import type { Customer, CustomerPayload, Vendor, VendorPayload } from '@/services/api';

// Rules mirror CustomerController / VendorController validation in Laravel.

export type CustomerForm = { name: string; company_name: string; phone: string; email: string; address: string };
export type CustomerErrors = Partial<Record<keyof CustomerForm, string>>;

export const emptyCustomer: CustomerForm = { name: '', company_name: '', phone: '', email: '', address: '' };

export function customerToForm(customer: Customer): CustomerForm {
  return {
    name: customer.name,
    company_name: customer.company_name ?? '',
    phone: customer.phone,
    email: customer.email ?? '',
    address: customer.address ?? '',
  };
}

export function validateCustomer(form: CustomerForm): CustomerErrors {
  const errors: CustomerErrors = {};
  if (!form.name.trim()) errors.name = 'Customer name is required.';
  if (!form.phone.trim()) errors.phone = 'Phone number is required.';
  else if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'Enter a valid phone number.';
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  return errors;
}

export function customerPayload(form: CustomerForm): CustomerPayload {
  return {
    name: form.name.trim(),
    company_name: form.company_name.trim() || null,
    phone: form.phone.trim(),
    email: form.email.trim() || null,
    address: form.address.trim() || null,
  };
}

export function CustomerFields({
  form,
  errors,
  onChange,
}: {
  form: CustomerForm;
  errors: CustomerErrors;
  onChange: (key: keyof CustomerForm, value: string) => void;
}) {
  return (
    <>
      <Section icon="account-outline" title="Customer details">
        <Field label="Customer name" required value={form.name} onChangeText={(value) => onChange('name', value)} placeholder="Enter customer name" error={errors.name} maxLength={255} />
        <View className="mt-3">
          <Field label="Company name" value={form.company_name} onChangeText={(value) => onChange('company_name', value)} placeholder="Enter company name" error={errors.company_name} maxLength={100} />
        </View>
      </Section>
      <Section icon="card-account-phone-outline" title="Contact details">
        <Field label="Phone number" required value={form.phone} onChangeText={(value) => onChange('phone', value)} placeholder="9876543210" keyboardType="phone-pad" error={errors.phone} maxLength={30} />
        <View className="mt-3">
          <Field label="Email" value={form.email} onChangeText={(value) => onChange('email', value)} placeholder="name@company.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} maxLength={255} />
        </View>
        <View className="mt-3">
          <Field label="Address" value={form.address} onChangeText={(value) => onChange('address', value)} placeholder="Enter complete address" multiline error={errors.address} />
        </View>
      </Section>
    </>
  );
}

export type VendorForm = { name: string; company_name: string; mobile: string; email: string; is_active: boolean };
export type VendorErrors = Partial<Record<keyof VendorForm, string>>;

export const emptyVendor: VendorForm = { name: '', company_name: '', mobile: '', email: '', is_active: true };

export function vendorToForm(vendor: Vendor): VendorForm {
  return {
    name: vendor.name,
    company_name: vendor.company_name ?? '',
    mobile: vendor.mobile || vendor.phone || '',
    email: vendor.email ?? '',
    is_active: vendor.is_active,
  };
}

export function validateVendor(form: VendorForm): VendorErrors {
  const errors: VendorErrors = {};
  if (!form.name.trim()) errors.name = 'Vendor name is required.';
  if (!form.company_name.trim()) errors.company_name = 'Company name is required.';
  if (!form.mobile.trim()) errors.mobile = 'Mobile number is required.';
  else if (!PHONE_PATTERN.test(form.mobile.trim())) errors.mobile = 'Enter a valid mobile number.';
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  return errors;
}

export function vendorPayload(form: VendorForm): VendorPayload {
  return {
    name: form.name.trim(),
    company_name: form.company_name.trim(),
    mobile: form.mobile.trim(),
    email: form.email.trim() || null,
    is_active: form.is_active,
  };
}

export function VendorFields({
  form,
  errors,
  onChange,
}: {
  form: VendorForm;
  errors: VendorErrors;
  onChange: <Key extends keyof VendorForm>(key: Key, value: VendorForm[Key]) => void;
}) {
  return (
    <>
      <Section icon="truck-outline" title="Vendor details">
        <Field label="Vendor name" required value={form.name} onChangeText={(value) => onChange('name', value)} placeholder="Enter vendor name" error={errors.name} maxLength={255} />
        <View className="mt-3">
          <Field label="Company name" required value={form.company_name} onChangeText={(value) => onChange('company_name', value)} placeholder="Enter company name" error={errors.company_name} maxLength={100} />
        </View>
      </Section>
      <Section icon="card-account-phone-outline" title="Contact details">
        <Field label="Mobile number" required value={form.mobile} onChangeText={(value) => onChange('mobile', value)} placeholder="9876543210" keyboardType="phone-pad" error={errors.mobile} maxLength={30} />
        <View className="mt-3">
          <Field label="Email" value={form.email} onChangeText={(value) => onChange('email', value)} placeholder="name@company.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} maxLength={255} />
        </View>
      </Section>
      <Pressable
        onPress={() => onChange('is_active', !form.is_active)}
        className="flex-row items-center rounded-[12px] border border-[#e0ddd8] bg-white p-3">
        <View className="min-w-0 flex-1">
          <Text className="font-manrope-extrabold text-[13px] text-[#10243e]">Active vendor</Text>
          <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#617091]">Active vendors can be assigned to bookings.</Text>
        </View>
        <Switch
          value={form.is_active}
          onValueChange={(value) => onChange('is_active', value)}
          trackColor={{ true: '#ffc79c', false: '#d8dce3' }}
          thumbColor={form.is_active ? ORANGE : '#f4f6fa'}
        />
      </Pressable>
    </>
  );
}
