import Footer from "../utils/footerTemplate.js";

const CardTransactionTemplet = (otp, { fullName, type, purchase, cardNumber, time, amount, localAmount, date, exchangeRate, origin }) => {
  const html = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  
  <head>
    <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--<![endif]-->
    <title></title>
  
    <style type="text/css">
      @media only screen and (min-width: 620px) {
        .u-row {
          width: 600px !important;
        }
        
        .u-row .u-col {
          vertical-align: top;
        }
        .u-row .u-col-42p84 {
          width: 257.04px !important;
        }
        .u-row .u-col-50 {
          width: 300px !important;
        }
        .u-row .u-col-57p16 {
          width: 342.96px !important;
        }
        .u-row .u-col-100 {
          width: 600px !important;
        }
        
      }
      
      @media (max-width: 620px) {
        .u-row-container {
          max-width: 100% !important;
          padding-left: 0px !important;
          padding-right: 0px !important;
        }
        .u-row .u-col {
          min-width: 320px !important;
          max-width: 100% !important;
          display: block !important;
        }
        .u-row {
          width: 100% !important;
        }
        .u-col {
          width: 100% !important;
        }
        .u-col>div {
          margin: 0 auto;
        }
      }
      
      body {
        margin: 0;
        padding: 0;
      }
      
      table,
      tr,
      td {
        vertical-align: top;
        border-collapse: collapse;
      }
      
      p {
        margin: 0;
      }
      
      .ie-container table,
      .mso-container table {
        table-layout: fixed;
      }
      
      * {
        line-height: inherit;
      }
      
      a[x-apple-data-detectors='true'] {
        color: inherit !important;
        text-decoration: none !important;
      }
      
      table,
      td {
        color: #000000;
      }
      
      #u_body a {
        color: #0000ee;
        text-decoration: underline;
      }
      
      #u_row_4{
        padding-bottom: 40px!important;
      }
      @media (max-width: 480px) {
        #u_content_image_1 .v-src-width {
          width: auto !important;
        }
        #u_content_image_1 .v-src-max-width {
          max-width: 60% !important;
        }
        #u_content_image_1 .v-text-align {
          text-align: center !important;
        }
        #u_column_5 .v-col-border {
          border-top: 0px solid transparent !important;
          border-left: 0px solid transparent !important;
          border-right: 0px solid transparent !important;
          border-bottom: 0px solid transparent !important;
        }
        #u_column_6 .v-col-padding {
          padding: 0px 0px 40px 40px !important;
        }
        #u_column_1 .v-col-padding {
          padding: 0px !important;
        }
        #u_content_image_2 .v-text-align {
          text-align: center !important;
        }
        #u_content_text_2 .v-text-align {
          text-align: center !important;
        }
        #u_content_text_1 .v-text-align {
          text-align: center !important;
        }
        #u_column_3 .v-col-padding {
          padding: 0px !important;
        }
        #u_content_text_3 .v-text-align {
          text-align: center !important;
        }
      }
    </style>
  
  
  
    <!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css2?family=Arvo&display=swap" rel="stylesheet" type="text/css">
    <!--<![endif]-->
  
  </head>
  
  <body class="clean-body u_body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #ffffff;color: #000000">
    <!--[if IE]><div class="ie-container"><![endif]-->
    <!--[if mso]><div class="mso-container"><![endif]-->
    <table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #ffffff;width:100%" cellpadding="0" cellspacing="0">
      <tbody>
        <tr style="vertical-align: top">
          <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #ffffff;"><![endif]-->
  
  
  
              <div class="u-row" style="background: linear-gradient(180deg, #D0FFE6 0%, #7DCCA1 125%);margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;"> 
                
                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                  <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
      
                      <!--[if (mso)|(IE)]><td align="center" width="600" class="v-col-padding v-col-border" style="background-color: #eab67d;width: 600px;padding: 36px 40px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                        <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                          <!--[if (!mso)&(!IE)]><!-->
                          <div class="v-col-padding v-col-border" style="box-sizing: border-box; height: 100%; padding: 36px 40px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                            <!--<![endif]-->
      
                            <table id="u_content_image_1" style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                              <tbody>
                                <tr>
                                  <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
      
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                      <tr>
                                        <td class="v-text-align" style="padding-right: 0px;padding-left: 0px;" align="left">
      
                                          <img align="left" border="0" src="https://easyemoney-email-template-images.s3.eu-west-2.amazonaws.com/stable-logo.png" alt="" title="" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 36%;max-width: 208.8px;"
                                            width="208.8" class="v-src-width v-src-max-width" />
      
                                        </td>
                                      </tr>
                                    </table>
      
                                  </td>
                                </tr>
                              </tbody>
                            </table>
      
                            <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                              <tbody>
                                <tr>
                                  <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
      
                                    <h1 class="v-text-align" style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-size: 24px; font-weight: 400;">Hi ${fullName}!</h1>
      
                                  </td>
                                </tr>
                              </tbody>
                            </table>
      
                            <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                              <tbody>
                                <tr>
                                  <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
      
                                    <div class="v-text-align" style="color: #000000; line-height: 140%; text-align: left; word-wrap: break-word;">
                                      <p style="font-size: 14px; line-height: 140%;">We would like to inform you that the next movement in your Stable® account has been recorded.</p>
                                    </div>
      
                                  </td>
                                </tr>
                              </tbody>
                            </table>
      
                            <!--[if (!mso)&(!IE)]><!-->
                          </div>
                          <!--<![endif]-->
                        </div>
                      </div>
                      <!--[if (mso)|(IE)]></td><![endif]-->
                      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                    </div>
                  </div>
                </div>
      
      
      
      
      
                <div class="u-row-container" style="padding: 0px;background-color: transparent">
                  <div id="u_row_4" class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                    <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
      
                      <!--[if (mso)|(IE)]><td align="center" width="340" class="v-col-padding v-col-border" style="width: 340px;padding: 0px 0px 0px 40px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 2px solid #eab67d;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div id="u_column_5" class="u-col u-col-57p16" style="max-width: 320px;min-width: 342.96px;display: table-cell;vertical-align: top;">
                        <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                          <!--[if (!mso)&(!IE)]><!-->
                          <div class="v-col-padding v-col-border" style="box-sizing: border-box; height: 100%; padding: 0px 0px 0px 40px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 2px solid #46cc85;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                            <!--<![endif]-->
      
                            <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                              <tbody>
                                <tr>
                                  <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
      
                                    <div class="v-text-align" style="font-size: 14px; line-height: 100%; text-align: left; word-wrap: break-word;">
                                      <p style="line-height: 100%;"><span>Card trnasaction: </span></p>
                                    </div>
      
                                  </td>
                                </tr>
                              </tbody>
                            </table>
      
                            <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                              <tbody>
                                <tr>
                                  <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
                                    <div class="v-text-align" style="font-family: Arvo; font-size: 29px; line-height: 160%; text-align: left; word-wrap: break-word;display:flex;">
                                      <span>$${amount}</span>
                                    <img align="center" border="0" src="https://assets.unlayer.com/projects/179888/1692885361003-Group%20285%20(1).png" alt="stable" title="table" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: 36px;float: none;width: 100%;max-width: 36px;padding-top: 3px;padding-left: 2px;"
                                      width="50"  class="v-src-width v-src-max-width" />
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
    
                                  <div class="v-text-align" style="font-size: 14px; line-height: 100%; text-align: left; word-wrap: break-word;">
                                    <p style="line-height: 100%;"><span>From your product:</span></p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
                           <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                              <tbody>
                              <tr>
                                  <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
      
                                    <div class="v-text-align" style="font-size: 12px; line-height: 40%; text-align: left; word-wrap: break-word;">
                                      <p style="line-height: 40%;"><span style="line-height: 5.6px;"><span> Card **** ${cardNumber}</span> </p>
                                    </div>
      
                                  </td>
                                </tr>
                              </tbody>
                            </table>
      
                            <!--[if (!mso)&(!IE)]><!-->
                          </div>
                          <!--<![endif]-->
                        </div>
                      </div>
                      <!--[if (mso)|(IE)]></td><![endif]-->
                      <!--[if (mso)|(IE)]><td align="center" width="257" class="v-col-padding v-col-border" style="width: 257px;padding: 0px 0px 0px 10px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                        <div id="u_column_6" class="u-col u-col-42p84" style="max-width: 320px;min-width: 257.04px;display: table-cell;vertical-align: top;">
                        <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                          <!--[if (!mso)&(!IE)]><!-->
                          <div class="v-col-padding v-col-border" style="box-sizing: border-box; height: 100%; padding: 0px 0px 0px 10px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                            <!--<![endif]-->
      
                            <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                              <tbody>
                                <tr>
                                  <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
      
                                    <div class="v-text-align" style="font-size: 12px; line-height: 140%; text-align: left; word-wrap: break-word;">
                                      <p style="line-height: 140%;"><strong>Details</strong></p>
                                    </div>
      
                                  </td>
                                </tr>
                              </tbody>
                            </table>
      
                            <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                              <tbody>
                                <tr>
                                  <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
      
                                    <div class="v-text-align" style="font-size: 12px; line-height: 40%; text-align: left; word-wrap: break-word;">
                                      <p style="line-height: 40%;"><strong>Purchase:</strong> ${purchase}</p>
                                    </div>
      
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
    
                                  <div class="v-text-align" style="font-size: 12px; line-height: 40%; text-align: left; word-wrap: break-word;">
                                    <p style="line-height: 40%;"><strong>Date:</strong> ${date}</p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
                           <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                            <tbody>
                              <tr>
                                <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
    
                                  <div class="v-text-align" style="font-size: 12px; line-height: 40%; text-align: left; word-wrap: break-word;">
                                    <p style="line-height: 40%;"><strong>Time:</strong> ${time}</p>
                                  </div>
    
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
  
                                <div class="v-text-align" style="font-size: 12px; line-height: 40%; text-align: left; word-wrap: break-word;">
                                  <p style="line-height: 40%;"><strong>Type:</strong> ${type}</p>
                                </div>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
      
                            <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                              <tbody>
                                <tr>
                                  <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
      
                                    <div class="v-text-align" style="font-size: 12px; line-height: 40%; text-align: left; word-wrap: break-word;">
                                      <p style="line-height: 40%;"><strong>Amount: </strong>${localAmount} COP</p>
                                    </div>
      
                                  </td>
                                </tr>
                              </tbody>
                            </table>
      
                            <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                              <tbody>
                                <tr>
                                  <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
      
                                    <div class="v-text-align" style="font-size: 12px; line-height: 40%; text-align: left; word-wrap: break-word;">
                                      <p style="line-height: 40%;"><strong>Exchange rate: </strong>1 SUSD= ${exchangeRate} COP</p>
                                    </div>
      
                                  </td>
                                </tr>
                              </tbody>
                            </table>
      
                            <!--[if (!mso)&(!IE)]><!-->
                          </div>
                          <!--<![endif]-->
                        </div>
                      </div>
                      <!--[if (mso)|(IE)]></td><![endif]-->
                      <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                    </div>
                  </div>
                </div>
  
                ${origin === "INTERNATIONAL"
      ? `
                  <div class="u-row-container" style="padding: 0px;background-color: transparent">
                    <div class="u-row"
                        style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                        <div
                            style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                            <div class="u-col u-col-100"
                                style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                                <div
                                    style="height: 100%;width: 100% !important;border-radius: 0px;">
                                    <div class="v-col-padding v-col-border"
                                        style="box-sizing: border-box; height: 100%; padding: 36px 40px;border-radius: 0px;">
                                        <table style="font-family:arial,helvetica,sans-serif;"
                                            role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                            <tbody>
                                                <tr>
                                                    <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;"
                                                        align="left">
                                                        <div class="v-text-align"
                                                            style="color: #000000; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                            <p style="font-size: 14px; line-height: 140%; margin: 0;">
                                                                <strong>PLEASE NOTE:</strong>
                                                            </p>
                                                            <p style="font-size: 14px; line-height: 140%; margin: 0;">
                                                                International card transactions may be subject to a service fee.
                                                            </p>
                                                            <p style="font-size: 14px; line-height: 140%; margin: 0;">
                                                                This fee is charged by external payment processors and is not imposed by STABLE.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                  `
      : ``
    }
              </div>
  
  
  
  
  
  
  
            <div class="u-row-container" style="padding: 0px;background-color: transparent">
              <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 600px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                  <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
  
                  <!--[if (mso)|(IE)]><td align="center" width="600" class="v-col-padding v-col-border" style="width: 600px;padding: 16px 0px 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                  <div class="u-col u-col-100" style="max-width: 320px;min-width: 600px;display: table-cell;vertical-align: top;">
                    <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                      <!--[if (!mso)&(!IE)]><!-->
                        <div class="v-col-padding v-col-border" style="box-sizing: border-box; height: 100%; padding: 16px 39px 0px 40px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                        <!--<![endif]-->
  
                        <table style="font-family:arial,helvetica,sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                          <tbody>
                            <tr>
                              <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:arial,helvetica,sans-serif;" align="left">
  
                                <div class="v-text-align" style="font-size: 14px; line-height: 140%; text-align: left; word-wrap: break-word;">
                                
                                    <p style="line-height: 140%;"><span style="line-height: 19.6px;" >
                                      This information is also available in your Stable® app under the "Transactions" option.
  <br>
  <br>
  Remember, we're always here for you. You can reach us at <span style="color: #000000; line-height: 19.6px;"><a style="color: #000000;" target="_blank" href="mailto:ayuda@stable-life.com" rel="noopener">ayuda@stable-life.com</a></span>
  <br>
  <br>
  Stable® team.
                                    </span>
                                  </p>
                                    
                                </div>
  
                              </td>
                            </tr>
                          </tbody>
                        </table>
  
                        <!--[if (!mso)&(!IE)]><!-->
                      </div>
                      <!--<![endif]-->
                    </div>
                  </div>
                  <!--[if (mso)|(IE)]></td><![endif]-->
                  <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
                </div>
              </div>
            </div>
  
  
  
  
  
             <div>
             ${Footer()}
           </div>
  
  
  
            <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
          </td>
        </tr>
      </tbody>
    </table>
    <!--[if mso]></div><![endif]-->
    <!--[if IE]></div><![endif]-->
  </body>
  
  </html>`;
  return html;
};
export default CardTransactionTemplet;
