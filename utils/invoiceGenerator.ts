import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';

interface OrderItem {
  products: {
    name: string;
    sellingPrice: number;
  };
  quantity: number;
  amount: number;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  sales: OrderItem[];
  client?: {
    name: string;
    phone?: string;
  };
}

const translations = {
  en: {
    invoice: 'INVOICE',
    invoiceNo: 'Invoice #',
    date: 'Date',
    client: 'Client',
    item: 'Item',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    total: 'Total',
    totalAmount: 'Total Amount'
  },
  ar: {
    invoice: 'فاتورة',
    invoiceNo: 'رقم الفاتورة',
    date: 'التاريخ',
    client: 'العميل',
    item: 'المنتج',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    total: 'المجموع',
    totalAmount: 'المبلغ الإجمالي'
  }
};

const formatCurrency = (amount: number) => {
  return `${amount.toFixed(2)} MAD`;
};

const generateInvoiceHTML = (order: Order, language: 'en' | 'ar' = 'en') => {
  const t = translations[language];
  const isArabic = language === 'ar';
  const direction = isArabic ? 'rtl' : 'ltr';
  const textAlign = isArabic ? 'right' : 'left';
  const date = new Date(order.created_at).toLocaleDateString(isArabic ? 'ar-MA' : 'en-US');
  
  const itemsHTML = order.sales.map(item => `
    <tr>
      <td>${item.products.name}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.products.sellingPrice)}</td>
      <td>${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `
    <html dir="${direction}">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { 
            font-family: ${isArabic ? 'Arial, sans-serif' : 'Helvetica, sans-serif'}; 
            padding: 20px;
            direction: ${direction};
            text-align: ${textAlign};
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .invoice-details { 
            margin-bottom: 20px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          th, td { 
            padding: 10px; 
            text-align: ${textAlign}; 
            border-bottom: 1px solid #ddd; 
          }
          .total { 
            text-align: ${isArabic ? 'left' : 'right'}; 
            font-weight: bold; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${t.invoice}</h1>
        </div>
        <div class="invoice-details">
          <p><strong>${t.invoiceNo}:</strong> ${order.id}</p>
          <p><strong>${t.date}:</strong> ${date}</p>
          ${order.client ? `<p><strong>${t.client}:</strong> ${order.client.name}</p>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>${t.item}</th>
              <th>${t.quantity}</th>
              <th>${t.unitPrice}</th>
              <th>${t.total}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        <div class="total">
          <p>${t.totalAmount}: ${formatCurrency(order.total_amount)}</p>
        </div>
      </body>
    </html>
  `;
};

export const generateAndShareInvoice = async (order: Order, shareViaWhatsApp = false, language: 'en' | 'ar' = 'ar') => {
  try {
    const html = generateInvoiceHTML(order, language);
    
    // Generate PDF file
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });

    // Rename the file to have .pdf extension
    const pdfFile = uri.substring(0, uri.lastIndexOf('/') + 1) + `invoice_${order.id}.pdf`;
    await FileSystem.moveAsync({
      from: uri,
      to: pdfFile
    });

    if (shareViaWhatsApp && order.client?.phone) {
      // Format phone number (remove spaces, ensure it starts with '+212')
      const phoneNumber = order.client.phone.replace(/\s/g, '')
        .replace(/^0/, '+212');
      
      // First share the PDF file
      await Sharing.shareAsync(pdfFile, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Invoice',
        UTI: 'com.adobe.pdf'
      });

      // Then open WhatsApp
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        throw new Error('WhatsApp is not installed');
      }
    } else {
      // Just share the PDF file
      await Sharing.shareAsync(pdfFile, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Invoice',
        UTI: 'com.adobe.pdf'
      });
    }

    // Clean up the file
    await FileSystem.deleteAsync(pdfFile);
  } catch (error) {
    console.error('Error generating/sharing invoice:', error);
    throw error;
  }
};