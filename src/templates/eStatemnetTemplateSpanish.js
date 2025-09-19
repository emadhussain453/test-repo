import moment from "moment";
import { locales } from "../constants/index.js";

const formatAmount = (amount, locale) => {
  let minimumFractionDigits = 2;
  let maximumFractionDigits = 2;
  if (locale !== locales.USD) {
    minimumFractionDigits = 0;
    maximumFractionDigits = 0;
  }
  return new Intl.NumberFormat(locale, { style: "decimal", minimumFractionDigits, maximumFractionDigits }).format(amount);
};

const record = (transaction, locale) => `

    <tr>
      <td
    style="
              padding: 12px 24px;
              white-space: nowrap;
              font-size: 11px;
              font-family: 'Aeonik', sans-serif;
              font-weight: 400;
            "
      >
        ${moment(transaction.createdAt).format("YYYY-MM-DDTHH:mm")}
      </td>
      <td
     
      style="
      padding: 12px 24px;
      white-space: nowrap;
      font-size: 11px;
      font-family: 'Aeonik', sans-serif;
      font-weight: 400;
    "
 
    >
        ${transaction.type}
      </td>
      <td
     
      
    style="
              padding: 12px 24px;
              white-space: nowrap;
              font-size: 11px;
              font-family: 'Aeonik', sans-serif;
              font-weight: 400;
            "
 
      >
        $${formatAmount(transaction.localAmount, locale)}
      </td>
      <td
     
      style="
      padding: 12px 24px;
       white-space: nowrap;
       font-size: 11px;
       font-family: 'Aeonik', sans-serif;
       font-weight: 400;
       display: flex;
       gap: 2px;
       align-items: center;
     "
 
 
    >
        $${(transaction.amount).toFixed(2)}
        ${transaction.transactionType === "cashout" && transaction.status !== "COMPLETED" ? `<div
        style="background-color: lightgray;  padding: 2px; font-size: 7px; border-radius: 5px; margin-top: 2px;"
        >Pending</div>` : ""}
      </td>
    </tr>
  `;

const showYearAndRecordColumn = (year, transaction, locale) => `

    <tr>
      <td
    style="
              padding: 5px 28px;
              white-space: nowrap;
              font-size: 11px;
              font-family: 'Aeonik', sans-serif;
              font-weight: 400;
            "
      >
      <p style="
      background-color: #EAB67D;
       padding: 5px;
       width: 45px;
       display: flex;
       border-radius:10px
       ;
       align-items: center;
       justify-content: center;">

        ${year}
        </p>
      </td>
      ${record(transaction, locale)}
  `;
const logAllRecords = (data, locale) => {
  let firstTransactionYear = null;
  const allrecords = data.map((transaction, i) => {
    const { createdAt } = transaction;
    const year = moment(createdAt).format("YYYY");
    if (i === 0) {
      firstTransactionYear = moment(createdAt).format("YYYY");
      return showYearAndRecordColumn(year, transaction, locale);
    }
    if (year !== firstTransactionYear) {
      firstTransactionYear = year;
      return showYearAndRecordColumn(year, transaction, locale);
    }
    return record(transaction, locale);
  }).join("");
  return allrecords;
};
const EstatementTemplateSpanish = ({ fullName, balance, initialBalance, totalCashin, totalCashout, email, address, date, data, currency }) => {
  const locale = locales[currency || "USD"];
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Estado de cuenta</title>
 
    <style>
    @import "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      background-color: #f5f5f5;
    }
      .container {
        width: 95%;
        max-width: 210mm;
        margin: 0 auto;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        padding: 8px;
        background-color: #ffffff;
        display: flex;
       
        align-items: center;
        flex-direction: column;
      }
 
      .brand-name {
        width: 100%;
        max-width: 210mm;
        font-size: 150px;
        font-weight: bold;
        display: flex;
        flex-direction: row;
      }
 
      .class-flex {
        display: flex;
        gap: 4px;
        width: 90%;
        margin-top: 8px;
      }
     
 
      .class-flexs {
        display: flex;
        gap: 16px;
        width: 90%;
      }
 
      .class-table {
     
        margin-top: 30px;
        width: 100%;
        padding: 10px;
      }
      .account-name {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 45%;
        margin: 0 auto;
        justify-content: flex-start;
        align-items: flex-start;
      }
      .inner-account-name {
        display: flex;
        flex-direction: column;
        width:100%;
        margin: 0 auto;
        justify-content: flex-start;
        align-items: flex-start;
      }
      @media (max-width: 768px) {
        .container {
          width: 90%;
        }
 
        .brand-name {
          font-size: 100px !important;
        }
 
        .class-flex {
          flex-direction: column;
          gap: 16px;
          width: 90%;
          margin-top: 8px;
        }
        .class-gradient {
          background: linear-gradient(to right, #fff7c6, #f3d19c);
        }
        .class-flexs {
          flex-direction: column;
          gap: 16px;
          width: 90%;
          margin-top: 8px;
        }
 
        .class-table {
          width: 100%;
          padding: 15px;
          overflow-x: auto;
        }
 
        .class-table table {
          width: 100%;
          display: block;
          overflow-x: auto;
          white-space: nowrap;
        }
 
        .class-table th,
        .class-table td {
          font-size: 12px;
        }
 
        .account-summary {
          width: 100% !important;
        }
        .account-name {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          margin: 0 auto;
          justify-content: flex-start;
          align-items: flex-start;
        }
        .class-hidden {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="container mx-auto mt-8">
        <div style="width: 100%; background: linear-gradient(to right, #FFF7C6, #f4d49f);">
        <div  class="class-gradient" style="  width: 100%; display: flex; align-items: start; justify-content: space-between;" >
        <div class="brand-name">
            <img style="padding: 40px;"  width="420px" src="https://d1edpvup4o304a.cloudfront.net/Group+288+(1).png" alt="">
         </div>
        <div
          class="class-hidden"
          style="border-left: 1px solid #B4B4B4; height: 72px; margin-top: 50px"
        ></div>
        <div
          style="
            display: flex;
            flex-direction: column;
            gap: 3px;
            width: 30%;
            margin-top: 50px;
            margin-left:18px;
            
          "
        >
        <div style="font-weight: 400; font-family: Aeonik-Medium, sans-serif; font-size: 24px ;color:black ; line-height:23px ">
            Estado de cuenta
          </div>
          <div
          style="font-weight: normal; font-family: Aeonik; font-size: 10px"
          >
            ${date}
          </div>
        </div>
      </div>
      <div style="padding-bottom: 20px;"  class="class-flexs">
        <div class="account-name">
          <div
            style="
              font-size: 24px;
              font-weight: 400;
              font-family: 'Aeonik', sans-serif;
            "
            id="name"
          >
           ${fullName}
          </div>
          <div class="inner-account-name">
          <div style="font-size: 12px; font-family: Aeonik, sans-serif">
            <span style="font-weight: 600; font-family: 'Aeonik-Medium' ;font-size: 10px">Correo electrónico:</span>
            <span id="email"style="font-weight: 400; font-size: 10px; font-family: 'Aeonik'">${email}</span>
          </div>
        
        </div>
        </div>
        <div class="account-summary" style="width: 40%">
          <div
            style="
              display: flex;
              flex-direction: column;
              gap: 8px;
              background: rgba(0, 0, 0, 0.06);
              width: 290px;
              height: auto;
              border-radius: 6px;
              padding: 20px;
             
            "
          >
            <div
              style="
                font-size: 14px;
                font-weight: 600;
                font-family: 'Aeonik', sans-serif;
              "
            >
              Resumen de la cuenta
            </div>
            <div style="display: flex; justify-content: start; align-items: center; width:100% ">
              <div
              style="font-size: 10px; font-weight: 600;   font-family: Aeonik-Medium, sans-serif; width:35%"
              >Divisa</div>
              <div    style="font-size: 10px; font-weight: 400;font-family: Aeonik, sans-serif; display:flex; align-items: start;width:50%  " id="currency">
                 Stable® USD
              </div>
            </div>
            <div style="display: flex; justify-content: start; align-items: center; width:100% ">
              <div
              style="font-size: 10px; font-weight: 600;   font-family: Aeonik-Medium, sans-serif; width:35%"
              >
                Saldo inicial
              </div>
              <div    style="font-size: 10px; font-weight: 400;font-family: Aeonik, sans-serif; display:flex; align-items: start;width:50%  " id="initialBalance">
                $${initialBalance} Stable® USD
              </div>
            </div>
            <div style="display: flex; justify-content: start; align-items: center; width:100% ">
              <div
              style="font-size: 10px; font-weight: 600;   font-family: Aeonik-Medium, sans-serif; width:35%"
              >+ Agregada</div>
              <div    style="font-size: 10px; font-weight: 400;font-family: Aeonik, sans-serif; display:flex; align-items: start;width:50%  " id="added">
                ${totalCashin} Stable® USD
              </div>
            </div>
            <div style="display: flex; justify-content: start; align-items: center; width:100% ">
              <div
              style="font-size: 10px; font-weight: 600;   font-family: Aeonik-Medium, sans-serif; width:35%"
              >- Enviada</div>
              <div    style="font-size: 10px; font-weight: 400;font-family: Aeonik, sans-serif; display:flex; align-items: start;width:50%  " id="sent">
                ${totalCashout} Stable® USD
              </div>
            </div>
            <div style="display: flex; justify-content: start; align-items: center; width:100% ">
              <div
              style="font-size: 10px; font-weight: 600;   font-family: Aeonik-Medium, sans-serif; width:35%"
              >Saldo final</div>
              <div   style="font-size: 10px; font-weight: 600; font-family: Aeonik-Medium ; display:flex; align-items: start;width:50% " id="finalBalance">
                $${balance} Stable® USD
            </div>
        </div>
      </div>
    
      
    </div>
  </div>
  </div>
      <div class="class-table">
        <table style="width: 100%; border-collapse: collapse">
          <thead>
            <tr>
              <th
              style="
              padding: 12px 24px;
              text-align: left;
              font-size: 11px;
              font-weight: 600;
              color: black;
              font-family: Aeonik, sans-serif;
            "
              >
                Fecha
              </th>
              <th
              style="
              padding: 12px 24px;
              text-align: left;
              font-size: 10px;
              font-size: 11px;
                  font-weight: 600;
              color: black;
              font-family: Aeonik, sans-serif;
            "
              >
                Detalle
              </th>
              <th
              style="
              padding: 12px 24px;
              text-align: left;
              font-size: 11px;
              font-weight: 600;
              color: black;
              font-family: Aeonik, sans-serif;
            "
              >
                Equivalencia en moneda local ${currency}
              </th>
              <th
              style="
              padding: 12px 24px;
              text-align: left;
              font-size: 11px;
              font-weight: 600;
              color: black;
              font-family: Aeonik, sans-serif;
            "
              >
                Cantidad Stable® USD
              </th>
            </tr>
          </thead>
 
        <tbody id="addedData">
 ${logAllRecords(data, locale)}
</tbody>
 
 
        </table>
      </div>
    </div>
 
   
  </body>
</html>`;

  return html;
};

export default EstatementTemplateSpanish;
