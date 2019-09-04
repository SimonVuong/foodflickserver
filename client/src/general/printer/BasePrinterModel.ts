export enum PrinterType {
  EPSON = 'epson',
  STAR = 'star',
}

export interface Printer {
  name: string;
  ip: string;
  port: string;
  type: PrinterType;
}

export interface RestPrinter extends Printer {
  isReceipt: boolean;
}
