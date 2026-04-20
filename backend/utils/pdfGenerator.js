const PDFDocument = require('pdfkit');

const generateReceiptPDF = (payment, bill, user) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).fillColor('#4F46E5').text('MultiBill', { align: 'center' });
        doc.fontSize(12).fillColor('#6B7280').text('Payment Receipt', { align: 'center' });
        doc.moveDown();

        // Divider
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E5E7EB');
        doc.moveDown();

        const labelColor = '#6B7280';
        const valueColor = '#111827';

        const row = (label, value) => {
            doc.fontSize(10).fillColor(labelColor).text(label, 50, doc.y, { continued: true, width: 200 });
            doc.fillColor(valueColor).text(value, { align: 'right' });
        };

        row('Receipt No:', `RCP-${payment._id.toString().slice(-8).toUpperCase()}`);
        row('Date:', new Date(payment.paidDate).toLocaleDateString('en-GB'));
        row('Customer:', user.name);
        row('Email:', user.email);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E5E7EB');
        doc.moveDown(0.5);

        row('Bill:', bill.title);
        row('Category:', bill.category.replace(/_/g, ' ').toUpperCase());
        row('Payment Method:', payment.method);
        row('Transaction ID:', payment.transactionId || 'N/A');
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#E5E7EB');
        doc.moveDown(0.5);

        // Amount
        doc.fontSize(14).fillColor('#4F46E5')
            .text(`Total Paid: $${payment.amount.toFixed(2)}`, { align: 'right' });

        doc.moveDown(2);
        doc.fontSize(10).fillColor('#9CA3AF')
            .text('This is a digitally generated receipt. Thank you for your payment.', { align: 'center' });
        doc.text('MultiBill Tracker — www.multibill.app', { align: 'center' });

        doc.end();
    });
};

const generateMonthlyReportPDF = (bills, payments, user, month) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Styling constants
        const primaryColor = '#4F46E5';
        const secondaryColor = '#10B981';
        const textColor = '#1F2937';
        const lightGray = '#9CA3AF';
        const dividerColor = '#E5E7EB';

        // Header
        doc.fontSize(26).fillColor(primaryColor).text('MultiBill', { align: 'right' });
        doc.fontSize(10).fillColor(lightGray).text('Financial Intelligence Report', { align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(dividerColor);
        doc.moveDown(1.5);

        // Title & Summary Section
        doc.fontSize(18).fillColor(textColor).text(`Monthly Summary — ${month}`, { underline: true });
        const userName = user && user.name ? String(user.name) : 'MultiBill User';
        const userEmail = user && user.email ? String(user.email) : '';
        doc.fontSize(11).fillColor(lightGray).text(`Report generated for ${userName} ${userEmail ? '(' + userEmail + ')' : ''}`);
        doc.moveDown(1.5);

        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const paidCount = bills.filter(b => b.status === 'paid').length;
        const totalBills = bills.length;

        // Statistics Cards (Text-based)
        const summaryY = doc.y;
        doc.fontSize(10).fillColor(textColor);
        doc.text('TOTAL SPENDING', 50, summaryY);
        doc.fontSize(20).fillColor(primaryColor).text(`$${totalAmount.toFixed(2)}`, 50, summaryY + 15);

        doc.fontSize(10).fillColor(textColor).text('BILLS SETTLED', 250, summaryY);
        doc.fontSize(20).fillColor(secondaryColor).text(`${paidCount} / ${totalBills}`, 250, summaryY + 15);

        doc.moveDown(3);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(dividerColor);
        doc.moveDown(1.5);

        // Group data by category
        const categories = [...new Set([
            ...bills.map(b => b.category), 
            ...payments.filter(p => p.billId && typeof p.billId === 'object').map(p => p.billId.category)
        ])].filter(c => c);
        
        if (categories.length === 0) {
            doc.fontSize(12).fillColor(lightGray).text('No transactions or bills found for the selected period.', { align: 'center' });
            doc.moveDown(2);
        }

        doc.fontSize(16).fillColor(textColor).text('Category-Wise Detailed Report');
        doc.moveDown(1);

        categories.forEach((cat) => {
            const catBills = bills.filter(b => b.category === cat);
            const catPayments = payments.filter(p => (p.billId && p.billId.category === cat) || (!p.billId && cat === 'other'));
            const catTotalPaid = catPayments.reduce((sum, p) => sum + p.amount, 0);
            const catTotalDue = catBills.reduce((sum, b) => sum + b.amount, 0);
            const uniquePhones = [...new Set(catPayments.map(p => p.phoneNumber).filter(n => n))];
            
            if (catBills.length === 0 && catPayments.length === 0) return;

            // Category Header Block
            doc.fontSize(14).fillColor(primaryColor).text(cat.replace(/_/g, ' ').toUpperCase());
            doc.fontSize(10).fillColor(textColor).text(`Summary: Paid $${catTotalPaid.toFixed(2)} / Total Due $${catTotalDue.toFixed(2)}`);
            doc.moveDown(0.5);

            if (uniquePhones.length > 0) {
                doc.fontSize(9).fillColor(textColor).text('Phone Numbers Used: ', { continued: true })
                   .fillColor(secondaryColor).text(uniquePhones.join(', '));
                doc.moveDown(0.8);
            }

            // Transaction History Section
            if (catPayments.length > 0) {
                doc.fontSize(10).fillColor(textColor).text('Payment History', { underline: true });
                doc.moveDown(0.3);
                
                const tableY = doc.y;
                doc.fontSize(8).fillColor(lightGray);
                doc.text('DESCRIPTION', 50, tableY);
                doc.text('DATE', 250, tableY);
                doc.text('PH. NUMBER', 350, tableY);
                doc.text('AMOUNT', 480, tableY, { align: 'right' });
                doc.moveDown(0.2);
                doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(dividerColor);
                doc.moveDown(0.3);

                 catPayments.forEach((p) => {
                     const rowY = doc.y;
                     const amount = p.amount || 0;
                     const date = p.paidDate || p.createdAt || new Date();
                     const title = (p.billId && p.billId.title) ? String(p.billId.title) : 'Direct Payment';
                     const phone = p.phoneNumber ? String(p.phoneNumber) : '-';

                     doc.fontSize(9).fillColor(textColor);
                     doc.text(title, 50, rowY, { width: 190 });
                     doc.text(new Date(date).toLocaleDateString('en-GB'), 250, rowY);
                     doc.text(phone, 350, rowY);
                     doc.text(`$${amount.toFixed(2)}`, 480, rowY, { align: 'right' });
                     doc.moveDown(0.5);
                     if (doc.y > 730) doc.addPage();
                 });
                doc.moveDown(1);
            }

            // Outstanding Bills Section
            const unpaidBills = catBills.filter(b => b.status !== 'paid');
            if (unpaidBills.length > 0) {
                doc.fontSize(10).fillColor('#EF4444').text('Outstanding Bills (Unpaid)', { underline: true });
                doc.moveDown(0.3);
                
                unpaidBills.forEach((b) => {
                    const rowY = doc.y;
                    const bTitle = b.title ? String(b.title) : 'Untitled Bill';
                    const bAmount = b.amount || 0;
                    const bDueDate = b.dueDate || new Date();

                    doc.fontSize(9).fillColor(textColor);
                    doc.text(bTitle, 50, rowY);
                    doc.text(`Due: ${new Date(bDueDate).toLocaleDateString('en-GB')}`, 250, rowY);
                    doc.fillColor('#EF4444').text(`$${bAmount.toFixed(2)}`, 480, rowY, { align: 'right' });
                    doc.moveDown(0.5);
                    if (doc.y > 730) doc.addPage();
                });
                doc.moveDown(1.5);
            } else {
                doc.fontSize(9).fillColor(secondaryColor).text('✓ All bills in this category are paid.');
                doc.moveDown(2);
            }

            doc.moveTo(40, doc.y).lineTo(555, doc.y).dash(3, { space: 2 }).stroke(dividerColor).undash();
            doc.moveDown(1.5);
        });

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor(lightGray)
               .text(`MultiBill Intelligence Report — Page ${i + 1} of ${pageCount}`, 0, 800, { align: 'center' });
        }

        doc.end();
    });
};

const generatePhoneReportPDF = (payments, number, user) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const primaryColor = '#10B981'; // Emerald/Green for Phone Reports
        const textColor = '#1F2937';
        const lightGray = '#9CA3AF';
        const dividerColor = '#E5E7EB';

        // Header
        doc.fontSize(26).fillColor(primaryColor).text('MultiBill', { align: 'right' });
        doc.fontSize(10).fillColor(lightGray).text('Phone Number Transaction Log', { align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(dividerColor);
        doc.moveDown(1.5);

        // Summary
        doc.fontSize(18).fillColor(textColor).text(`Report for: ${number}`, { underline: false });
        const userName = user && user.name ? String(user.name) : 'MultiBill User';
        doc.fontSize(11).fillColor(lightGray).text(`Generated for ${userName} on ${new Date().toLocaleDateString('en-GB')}`);
        doc.moveDown(1.5);

        const totalAmount = payments.reduce((sum, p) => p.status === 'success' ? sum + p.amount : sum, 0);
        const successCount = payments.filter(p => p.status === 'success').length;

        // Stats Row
        const summaryY = doc.y;
        doc.fontSize(10).fillColor(textColor).text('TOTAL PAID', 50, summaryY);
        doc.fontSize(18).fillColor(primaryColor).text(`$${totalAmount.toFixed(2)}`, 50, summaryY + 15);

        doc.fontSize(10).fillColor(textColor).text('SUCCESSFUL TRANSFERS', 250, summaryY);
        doc.fontSize(18).fillColor(textColor).text(`${successCount} / ${payments.length}`, 250, summaryY + 15);

        doc.moveDown(3.5);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(dividerColor);
        doc.moveDown(1.5);

        // Transaction Table
        doc.fontSize(14).fillColor(textColor).text('Detailed Transaction History');
        doc.moveDown(1);

        const tableY = doc.y;
        doc.fontSize(8).fillColor(lightGray);
        doc.text('DESCRIPTION', 50, tableY);
        doc.text('DATE', 250, tableY);
        doc.text('STATUS', 350, tableY);
        doc.text('AMOUNT', 480, tableY, { align: 'right' });
        doc.moveDown(0.2);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(dividerColor);
        doc.moveDown(0.3);

        payments.forEach((p) => {
            const rowY = doc.y;
            const amount = p.amount || 0;
            const date = p.paidDate || p.createdAt || new Date();
            const title = (p.billId && p.billId.title) ? String(p.billId.title) : 'Direct Payment';
            const statusStr = (p.status || 'unknown').toUpperCase();

            doc.fontSize(9).fillColor(textColor);
            doc.text(title, 50, rowY, { width: 190 });
            doc.text(new Date(date).toLocaleDateString('en-GB'), 250, rowY);
            
            const statusColor = p.status === 'success' ? '#10B981' : '#EF4444';
            doc.fillColor(statusColor).text(statusStr, 350, rowY);
            
            doc.fillColor(textColor).text(`$${amount.toFixed(2)}`, 480, rowY, { align: 'right' });
            doc.moveDown(0.6);

            if (doc.y > 750) doc.addPage();
        });

        // Footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).fillColor(lightGray).text(`MultiBill Log — Page ${i + 1} of ${pageCount}`, 0, 810, { align: 'center' });
        }

        doc.end();
    });
};

module.exports = { generateReceiptPDF, generateMonthlyReportPDF, generatePhoneReportPDF };
