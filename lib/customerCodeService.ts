import { dbOperation } from './firebase';

interface CustomerCodeData {
  id: string;
  code: string;
  customer_name: string;
  user_phone?: string;
  is_active: boolean;
  status: string;
  wallet_balance: number;
  created_at: string;
}

export class CustomerCodeService {
  static async syncLocalCodesToDatabase(): Promise<void> {
    const localCodes = JSON.parse(localStorage.getItem('local_customer_codes') || '[]');
    if (localCodes.length === 0) return;

    try {
      for (const code of localCodes) {
        await dbOperation('set', 'customer_codes', code, code.id);
      }

      // مسح البيانات المحلية بعد النقل الناجح
      localStorage.removeItem('local_customer_codes');
      console.log('Local codes synced successfully');
    } catch (error) {
      console.error('Failed to sync local codes:', error);
      throw error;
    }
  }
  // تخزين محلي مؤقت للأكواد عند فشل قاعدة البيانات
  private static localCodes: CustomerCodeData[] = JSON.parse(localStorage.getItem('local_customer_codes') || '[]');

  private static saveToLocal(code: CustomerCodeData) {
    this.localCodes.push(code);
    localStorage.setItem('local_customer_codes', JSON.stringify(this.localCodes));
  }

  static async createCustomerCode(data: Omit<CustomerCodeData, 'id' | 'created_at'>): Promise<CustomerCodeData | null> {
    // Validation
    if (!data.customer_name?.trim()) throw new Error('Customer name is required');
    if (!data.code?.trim()) throw new Error('Code is required');
    if (data.user_phone && !/^\+?\d{10,15}$/.test(data.user_phone)) throw new Error('Invalid phone number');

    const newData: CustomerCodeData = {
      ...data,
      id: `C-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    try {
      await dbOperation('set', 'customer_codes', newData, newData.id);
      return newData;
    } catch (error) {
      console.error('Failed to create customer code in database, saving locally:', error);
      // حفظ محلياً عند فشل قاعدة البيانات
      this.saveToLocal(newData);
      return newData;
    }
  }

  static async approvePendingCode(id: string, code: string): Promise<void> {
    try {
      await dbOperation('update', 'customer_codes', { status: 'approved', is_active: true, code }, id);
    } catch (error) {
      console.error('Failed to approve code:', error);
      throw new Error('Unable to approve code.');
    }
  }

  static async getCustomerCodeByCode(code: string): Promise<CustomerCodeData | null> {
    try {
      const allCodes = await dbOperation('get', 'customer_codes');
      const found = allCodes.find((c: any) => c.code === code && c.is_active);
      return found || null;
    } catch (error) {
      console.error('Failed to get customer code:', error);
      return null;
    }
  }
}
