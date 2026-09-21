using System.Globalization;
using ClosedXML.Excel;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Operations;

namespace HandmadeFinance.Infrastructure;

public sealed class ClosedXmlSheetReader : IImportSheetReader
{
    public IReadOnlyList<SheetRow> Read(Stream stream)
    {
        XLWorkbook workbook;
        try
        {
            workbook = new XLWorkbook(stream);
        }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        {
            throw AppException.Validation("The file is not a valid .xlsx workbook.");
        }

        using (workbook)
        {
            var sheet = workbook.Worksheets.FirstOrDefault();
            var used = sheet?.RangeUsed(XLCellsUsedOptions.Contents);
            if (sheet is null || used is null)
                return [];

            var firstRow = used.FirstRow().RowNumber();
            var lastRow = used.LastRow().RowNumber();
            var firstColumn = used.FirstColumn().ColumnNumber();
            var lastColumn = used.LastColumn().ColumnNumber();
            var rows = new List<SheetRow>();
            for (var r = firstRow; r <= lastRow; r++)
            {
                var cells = new List<string>();
                for (var c = firstColumn; c <= lastColumn; c++)
                    cells.Add(Text(sheet.Cell(r, c)));
                rows.Add(new(r, cells));
            }
            return rows;
        }
    }

    private static string Text(IXLCell cell)
    {
        if (cell.IsEmpty())
            return "";
        return cell.DataType switch
        {
            XLDataType.DateTime => cell.GetDateTime().ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            XLDataType.Number => cell.GetDouble().ToString("0.############", CultureInfo.InvariantCulture),
            _ => cell.GetString(),
        };
    }
}
