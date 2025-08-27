import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Define interfaces for export data
interface ExportableRecord {
  [key: string]: string | number | undefined | null;
}

export const exportToExcel = (data: ExportableRecord[], filename: string) => {
    // Convert data to worksheet format
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length))
    }));
    ws['!cols'] = colWidths;
    
    // Create workbook 
    const wb = { Sheets: { 'Visitor Logs': ws }, SheetNames: ['Visitor Logs'] };
    
    // Generate excel file
    const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Download file
    saveAs(excelBlob, `${filename}.xlsx`);
}

// Export to CSV
export const exportToCSV = (data: ExportableRecord[], filename: string) => {
    // Convert data to CSV format
    const headers = Object.keys(data[0] || {});
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma or newline
            const escapedValue = String(value).replace(/"/g, '""');
            return `"${escapedValue}"`;
        }).join(','))
    ].join('\n');

    // Create and download CSV file
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(csvBlob, `${filename}.csv`);
}

// Enhanced export with filtering options
export const exportFilteredData = (
    data: ExportableRecord[], 
    filename: string, 
    filters: {
        searchTerm?: string;
        statusFilter?: string;
        dateRange?: { start: Date; end: Date };
    } = {}
) => {
    let filteredData = [...data];
    
    // Apply search filter
    if (filters.searchTerm) {
        filteredData = filteredData.filter(item => 
            Object.values(item).some(value => 
                String(value).toLowerCase().includes(filters.searchTerm!.toLowerCase())
            )
        );
    }
    
    // Apply status filter
    if (filters.statusFilter) {
        filteredData = filteredData.filter(item => {
            if (filters.statusFilter === 'checked-out') {
                return item.Status === 'Checked Out';
            } else if (filters.statusFilter === 'checked-in') {
                return item.Status === 'Checked In';
            }
            return true;
        });
    }
    
    // Apply date range filter
    if (filters.dateRange) {
        filteredData = filteredData.filter(item => {
            const checkInValue = item['Check In'];
            if (!checkInValue) return false;
            const checkInDate = new Date(checkInValue);
            return checkInDate >= filters.dateRange!.start && checkInDate <= filters.dateRange!.end;
        });
    }
    
    // Export filtered data
    exportToExcel(filteredData, `${filename}-filtered`);
    
    return filteredData.length;
}

// Export with custom formatting
export const exportWithCustomFormat = (
    data: ExportableRecord[], 
    filename: string, 
    format: 'excel' | 'csv' = 'excel'
) => {
    // Transform data for better export formatting (flattened structure)
    const formattedData = data.map(item => ({
        'Visitor Name': item.visitorName || item['Visitor Name'],
        'Relation': item.relation || item['Relation'],
        'Status': item.status || item['Status'],
        'Student Name': item.studentName || item['Student'],
        'Room': item.room || item['Room'],
        'Email': item.studentEmail || 'N/A',
        'Check In': item.checkIn || item['Check In'],
        'Check Out': item.checkOut || item['Check Out'],
        'Duration': item.duration || 'N/A',
        'Hostel': item.hostelName || item['Hostel']
    }));
    
    if (format === 'excel') {
        exportToExcel(formattedData, filename);
    } else {
        exportToCSV(formattedData, filename);
    }
}
