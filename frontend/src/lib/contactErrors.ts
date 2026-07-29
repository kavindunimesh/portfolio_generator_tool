export type ContactFieldErrors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export class ContactSubmitError extends Error {
  fields: ContactFieldErrors;
  constructor(message: string, fields: ContactFieldErrors = {}) {
    super(message);
    this.name = 'ContactSubmitError';
    this.fields = fields;
  }
}
