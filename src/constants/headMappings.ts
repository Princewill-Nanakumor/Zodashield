// src/constants/headerMappings.ts
export const headerMappings: Record<string, string[]> = {
  name: [
    "name",
    "full name",
    "contact name",
    "customer name",
    "client name",
    "firstname",
    "first name",
    "lastname",
    "last name",
    "surname",
    "Name",
    "NAME",
    "First Name",
    "Last Name",
    "FIRST NAME",
    "LAST NAME",
  ],
  email: [
    "email",
    "email address",
    "mail",
    "e-mail",
    "contact email",
    "customer email",
    "emailaddress",
    "Email",
    "EMAIL",
    "Email Address",
    "Email address",
    "Emails",
    "EMAILS",
  ],
  phone: [
    "phone",
    "phone no",
    "Phone no",
    "phone number",
    "contact number",
    "mobile",
    "telephone",
    "tel",
    "contact phone",
    "phonenumber",
    "Phone",
    "PHONE",
    "Mobile",
    "MOBILE",
    "Cell",
    "CELL",
  ],
  source: [
    "Source",
    "organization",
    "organisation",
    "business name",
    "company name",
    "businessname",
    "source",
    "BUSINESS",
  ],
  status: [
    "status",
    "lead status",
    "contact status",
    "stage",
    "Status",
    "STATUS",
    "Stage",
    "STAGE",
    "State",
    "STATE",
  ],
  country: [
    "country",
    "nation",
    "location",
    "Country",
    "Countries",
    "countries",
    "COUNTRY",
    "Country Name",
    "country name",
    "Location",
    "LOCATION",
    "Region",
    "REGION",
  ],
  comments: [
    "comments",
    "comment",
    "notes",
    "note",
    "description",
    "Comments",
    "COMMENTS",
    "Notes",
    "NOTES",
    "Description",
    "DESCRIPTION",
    "Additional Info",
    "additional info",
    "Additional Information",
    "additional information",
  ],
};

export const VALID_STATUSES = [
  "New",
  "Contacted",
  "In Progress",
  "Qualified",
  "Lost",
  "Won",
] as const;

export type ValidStatus = (typeof VALID_STATUSES)[number];

export const DEFAULT_STATUS = "New";

export const REQUIRED_FIELDS = ["name", "email"] as const;

export const OPTIONAL_FIELDS = [
  "phone",
  "source",
  "status",
  "country",
  "comments",
] as const;

export const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as const;

export type ContactField = (typeof ALL_FIELDS)[number];

export const FIELD_LABELS: Record<ContactField, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  source: "Source",
  status: "Status",
  country: "Country",
  comments: "Comments",
};

export const FIELD_DESCRIPTIONS: Record<ContactField, string> = {
  name: "Full name of the contact",
  email: "Email address",
  phone: "Contact phone number",
  source: "Source or organization name",
  status: "Current status of the contact",
  country: "Country of residence",
  comments: "Additional notes or comments",
};
