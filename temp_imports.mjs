import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import * as fileSaverPkg from "file-saver";
const saveAs = fileSaverPkg.saveAs || fileSaverPkg.default?.saveAs || fileSaverPkg.default;
