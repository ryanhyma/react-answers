import * as XLSX from 'xlsx';
import { flatten } from 'flat';
const ExportService = {

    jsonToFlatTable: (data) => {

        // Ensure data is an array and not null/undefined
        if (!Array.isArray(data) || data.length === 0) {
            console.error("jsonToFlatTable: Received invalid or empty data", data);
            return { headers: [], rows: [] };
        }

        // Step 1: Filter out null/undefined objects before flattening
        const validItems = data.filter(item => item && typeof item === "object");

        if (validItems.length === 0) {
            console.error("jsonToFlatTable: No valid objects to process");
            return { headers: [], rows: [] };
        }

        // Step 2: Flatten each object safely
        const flattenedItems = validItems.map(obj => flatten(obj));

        // Step 3: Get all unique headers (keys) across all objects
        const headers = [...new Set(flattenedItems.flatMap(Object.keys))];

        // Step 4: Create rows, ensuring consistent header order
        const rows = flattenedItems.map(item =>
            headers.map(header => item[header] ?? '')
        );

        return { headers, rows };

    },
    worksheetDataToCSV(worksheetData, filename) {
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch Data');
        const csvBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'array' });
        const blob = new Blob([csvBuffer], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    worksheetDataToExcel(worksheetData, filename) {
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Bold the headings
        const headingRange = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = headingRange.s.c; C <= headingRange.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[cellAddress]) continue;
            if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
            if (!worksheet[cellAddress].s.font) worksheet[cellAddress].s.font = {};
            worksheet[cellAddress].s.font.bold = true;
        }

        // Add filters
        worksheet['!autofilter'] = { ref: worksheet['!ref'] };

        // Adjust column widths
        const colWidths = worksheetData[0].map((_, colIndex) => ({
            wch: Math.max(...worksheetData.map(row => (row[colIndex] ? row[colIndex].toString().length : 10)))
        }));
        worksheet['!cols'] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch Data');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    ,
    chatsToSpreadsheet: async (chats, headerOrder, type = 'excel', filename) => {
        const worksheetData = [];

        for (const chat of chats) {
            const interactions = chat.interactions;
            const items = interactions;
            const { headers, rows } = ExportService.jsonToFlatTable(items);
            const filteredHeaders = headers.filter(header => !header.includes('_id') && !header.includes('__v'));
            const filteredRows = rows.map(row =>
                filteredHeaders.map(header => row[headers.indexOf(header)])
            );

            const orderedHeaders = headerOrder.map(headerObj => headerObj.dataLabel)
                .concat(filteredHeaders.filter(header => !headerOrder.some(headerObj => headerObj.dataLabel === header)));

            const orderedRows = filteredRows.map(row =>
                orderedHeaders.map(header => row[filteredHeaders.indexOf(header)])
            );

            const finalHeaders = orderedHeaders.map(header => {
                const headerObj = headerOrder.find(headerObj => headerObj.dataLabel === header);
                return headerObj ? headerObj.outputLabel : header;
            });

            if (worksheetData.length === 0) {
                worksheetData.push(finalHeaders);
            }
            worksheetData.push(...orderedRows);
        }

        if (type === 'xlsx') {
            ExportService.worksheetDataToExcel(worksheetData, filename);
        } else if (type === 'csv') {
            ExportService.worksheetDataToCSV(worksheetData, filename);
        }
    }, exportChats: (chats, filename) => {
        const headerOrder = [
            { dataLabel: 'interaction.createdAt', outputLabel: 'createdAt' },
            { dataLabel: 'chat.language', outputLabel: 'pageLanguage' },
            { dataLabel: 'interaction.referringUrl', outputLabel: 'referringUrl' },
            { dataLabel: 'question.language', outputLabel: 'questionLanguage' },
            { dataLabel: 'question.redactedQuestion', outputLabel: 'redactedQuestion' },
            { dataLabel: 'chat.aiService', outputLabel: 'aiService' },
            { dataLabel: 'question.citation.citationUrl', outputLabel: 'citationUrl' },
            { dataLabel: 'question.citation.confidenceRating', outputLabel: 'confidenceRating' },
            { dataLabel: 'answer.englishAnswer', outputLabel: 'englishAnswer' },
            { dataLabel: 'answer.answer', outputLabel: 'answer' },
            { dataLabel: 'answer.sentences.sentence0', outputLabel: 'sentence1' },
            { dataLabel: 'answer.sentences.sentence1', outputLabel: 'sentence2' },
            { dataLabel: 'answer.sentences.sentence2', outputLabel: 'sentence3' },
            { dataLabel: 'answer.sentences.sentence3', outputLabel: 'sentence4' },
            { dataLabel: 'chat.feedback', outputLabel: 'feedback' },
            { dataLabel: 'interaction.expertFeedback.totalScore', outputLabel: 'expertFeedback.totalScore' },
            { dataLabel: 'interaction.expertFeedback.sentence1Score', outputLabel: 'expertFeedback.sentence1Score' },
            { dataLabel: 'interaction.expertFeedback.sentence2Score', outputLabel: 'expertFeedback.sentence2Score' },
            { dataLabel: 'interaction.expertFeedback.sentence3Score', outputLabel: 'expertFeedback.sentence3Score' },
            { dataLabel: 'interaction.expertFeedback.sentence4Score', outputLabel: 'expertFeedback.sentence4Score' },
            { dataLabel: 'interaction.expertFeedback.citationScore', outputLabel: 'expertFeedback.citationScore' },
            { dataLabel: 'interaction.expertFeedback.answerImprovement', outputLabel: 'expertFeedback.answerImprovement' },
            { dataLabel: 'interaction.expertFeedback.expertCitationUrl', outputLabel: 'expertFeedback.expertCitationUrl' },
        ];
        const type = filename.endsWith('.csv') ? 'csv' : filename.endsWith('.xlsx') ? 'xlsx' : 'xlsx';
        return ExportService.chatsToSpreadsheet(chats, headerOrder, type, filename);
    },

};
export default ExportService;
