export interface MailModuleOption {
  apiKey: string;
  domain: string;
  fromEmail: string;
  isGlobal?: boolean;
}

export interface EmailVars {
  key: string;
  value: string;
}
