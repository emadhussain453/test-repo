import Footer from "../utils/footerTemplate.js";

const ActivateCardTemplate = (otp, { userName }) => {
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html
      xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
    >
      <head>
        <!--[if gte mso 9]>
          <xml>
            <o:OfficeDocumentSettings>
              <o:AllowPNG />
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        <![endif]-->
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <!--[if !mso]><!-->
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <!--<![endif]-->
        <title></title>
    
        <style type="text/css">
          @media only screen and (min-width: 720px) {
            .u-row {
              width: 700px !important;
            }
            .u-row .u-col {
              vertical-align: top;
            }
    
            .u-row .u-col-25p29 {
              width: 177.03px !important;
            }
    
            .u-row .u-col-33p33 {
              width: 233.31px !important;
            }
    
            .u-row .u-col-74p71 {
              width: 522.9699999999999px !important;
            }
    
            .u-row .u-col-100 {
              width: 700px !important;
            }
          }
    
          @media (max-width: 720px) {
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
            .u-col > div {
              margin: 0 auto;
            }
            .no-stack .u-col {
              min-width: 0 !important;
              display: table-cell !important;
            }
    
            .no-stack .u-col-25p29 {
              width: 25.29% !important;
            }
    
            .no-stack .u-col-74p71 {
              width: 74.71% !important;
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
    
          a[x-apple-data-detectors="true"] {
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
          @media (max-width: 480px) {
            #u_content_image_1 .v-src-width {
              width: auto !important;
            }
            #u_content_image_1 .v-src-max-width {
              max-width: 94% !important;
            }
            #u_content_image_5 .v-src-width {
              width: auto !important;
            }
            #u_content_image_5 .v-src-max-width {
              max-width: 94% !important;
            }
            #u_content_heading_1 .v-container-padding-padding {
              padding: 10px !important;
            }
            #u_content_heading_1 .v-text-align {
              text-align: center !important;
            }
            #u_content_text_1 .v-container-padding-padding {
              padding: 10px !important;
            }
            #u_content_text_1 .v-text-align {
              text-align: center !important;
            }
            #u_column_5 .v-col-padding {
              padding: 0px !important;
            }
            #u_content_image_7 .v-src-width {
              width: auto !important;
            }
            #u_content_image_7 .v-src-max-width {
              max-width: 20% !important;
            }
            #u_content_image_7 .v-text-align {
              text-align: center !important;
            }
            #u_content_image_8 .v-src-width {
              width: auto !important;
            }
            #u_content_image_8 .v-src-max-width {
              max-width: 34% !important;
            }
            #u_content_image_8 .v-text-align {
              text-align: center !important;
            }
            #u_content_heading_5 .v-container-padding-padding {
              padding: 40px !important;
            }
            #u_content_heading_5 .v-text-align {
              text-align: center !important;
            }
            #u_content_button_1 .v-container-padding-padding {
              padding: 10px !important;
            }
            #u_content_button_1 .v-text-align {
              text-align: center !important;
            }
            #u_content_text_14 .v-container-padding-padding {
              padding: 10px !important;
            }
            #u_content_text_14 .v-text-align {
              text-align: center !important;
            }
          }
        </style>
    
        <!--[if !mso]><!-->
        <link
          href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300&display=swap"
          rel="stylesheet"
          type="text/css"
        />
        <!--<![endif]-->
      </head>
    
      <body
        class="clean-body u_body"
        style="
          margin: 0;
          padding: 0;
          -webkit-text-size-adjust: 100%;
          background-color: #f7f8f9;
          color: #000000;
        "
      >
        <!--[if IE]><div class="ie-container"><![endif]-->
        <!--[if mso]><div class="mso-container"><![endif]-->
        <table
          id="u_body"
          style="
            border-collapse: collapse;
            table-layout: fixed;
            border-spacing: 0;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            vertical-align: top;
            min-width: 320px;
            margin: 0 auto;
            background-color: #f7f8f9;
            width: 100%;
          "
          cellpadding="0"
          cellspacing="0"
        >
          <tbody>
            <tr style="vertical-align: top">
              <td
                style="
                  word-break: break-word;
                  border-collapse: collapse !important;
                  vertical-align: top;
                "
              >
                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #f7f8f9;"><![endif]-->
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-image: linear-gradient(
                        to bottom,
                        #eab7e9,
                        #ffe6fb
                      );
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: #eab7e9;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="700" class="v-col-padding" style="width: 700px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-100"
                        style="
                          max-width: 320px;
                          min-width: 700px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              id="u_content_image_1"
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 40px 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <table
                                      width="100%"
                                      cellpadding="0"
                                      cellspacing="0"
                                      border="0"
                                    >
                                      <tr>
                                        <td
                                          class="v-text-align"
                                          style="
                                            padding-right: 0px;
                                            padding-left: 0px;
                                          "
                                          align="center"
                                        >
                                          <img
                                            align="center"
                                            border="0"
                                            src="https://assets.unlayer.com/projects/0/1721045234685-Group%20289.png"
                                            alt=""
                                            title=""
                                            style="
                                              outline: none;
                                              text-decoration: none;
                                              -ms-interpolation-mode: bicubic;
                                              clear: both;
                                              display: inline-block !important;
                                              border: none;
                                              height: auto;
                                              float: none;
                                              width: 80%;
                                              max-width: 544px;
                                            "
                                            width="544"
                                            class="v-src-width v-src-max-width"
                                          />
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
    
                            <table
                              id="u_content_image_5"
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 20px 10px 40px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <table
                                      width="100%"
                                      cellpadding="0"
                                      cellspacing="0"
                                      border="0"
                                    >
                                      <tr>
                                        <td
                                          class="v-text-align"
                                          style="
                                            padding-right: 0px;
                                            padding-left: 0px;
                                          "
                                          align="center"
                                        >
                                          <img
                                            align="center"
                                            border="0"
                                            src="https://assets.unlayer.com/projects/0/1721048593116-Group%20311.png"
                                            alt=""
                                            title=""
                                            style="
                                              outline: none;
                                              text-decoration: none;
                                              -ms-interpolation-mode: bicubic;
                                              clear: both;
                                              display: inline-block !important;
                                              border: none;
                                              height: auto;
                                              float: none;
                                              width: 88%;
                                              max-width: 598.4px;
                                            "
                                            width="598.4"
                                            class="v-src-width v-src-max-width"
                                          />
                                        </td>
                                      </tr>
                                    </table>
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: #ffe6fb;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: #ffe6fb;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="700" class="v-col-padding" style="width: 700px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-100"
                        style="
                          max-width: 320px;
                          min-width: 700px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              id="u_content_heading_1"
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px 10px 10px 50px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <!--[if mso]><table width="100%"><tr><td><![endif]-->
                                    <h1
                                      class="v-text-align"
                                      style="
                                        margin: 0px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                        font-size: 22px;
                                        font-weight: 400;
                                      "
                                    >
                                      <span
                                        ><span
                                          ><span
                                            ><span
                                              ><span
                                                ><span>Hi ${userName}!</span></span
                                              ></span
                                            ></span
                                          ></span
                                        ></span
                                      >
                                    </h1>
                                    <!--[if mso]></td></tr></table><![endif]-->
                                  </td>
                                </tr>
                              </tbody>
                            </table>
    
                            <table
                              id="u_content_text_1"
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px 10px 10px 50px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <div
                                      class="v-text-align"
                                      style="
                                        font-size: 14px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                      "
                                    >
                                      <p style="line-height: 140%">
                                        <span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjg1NDQ2MTk1NywiZGF0YVR5cGUiOiJzY2VuZSJ9Cg==(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span style="line-height: 19.6px"
                                          >You are already a resident of the Stable®
                                          world</span
                                        >
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: #ffe6fb;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: #ffe6fb;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="233" class="v-col-padding" style="width: 233px;padding: 0px 0px 0px 20px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        id="u_column_5"
                        class="u-col u-col-33p33"
                        style="
                          max-width: 320px;
                          min-width: 233.33px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px 0px 0px 20px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <!--[if mso]><table width="100%"><tr><td><![endif]-->
                                    <h1
                                      class="v-text-align"
                                      style="
                                        margin: 0px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                        font-size: 22px;
                                        font-weight: 400;
                                      "
                                    >
                                      <span><span>ATM</span></span>
                                    </h1>
                                    <!--[if mso]></td></tr></table><![endif]-->
                                  </td>
                                </tr>
                              </tbody>
                            </table>
    
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <div
                                      class="v-text-align"
                                      style="
                                        font-size: 14px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                      "
                                    >
                                      <p style="line-height: 140%">
                                        <span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjc1NDgzNTQ0MSwiZGF0YVR5cGUiOiJzY2VuZSJ9Cg==(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjEzNTczNTYxODQsImRhdGFUeXBlIjoic2NlbmUifQo=(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span style="line-height: 19.6px"
                                          >The ability to use your Stable® card to
                                          withdraw money from ATMs worldwide.</span
                                        >
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
                      <!--[if (mso)|(IE)]><td align="center" width="233" class="v-col-padding" style="width: 233px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-33p33"
                        style="
                          max-width: 320px;
                          min-width: 233.33px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <table
                                      width="100%"
                                      cellpadding="0"
                                      cellspacing="0"
                                      border="0"
                                    >
                                      <tr>
                                        <td
                                          class="v-text-align"
                                          style="
                                            padding-right: 0px;
                                            padding-left: 0px;
                                          "
                                          align="left"
                                        >
                                          <img
                                            align="left"
                                            border="0"
                                            src="https://assets.unlayer.com/projects/0/1721049001836-Capa_1.png"
                                            alt=""
                                            title=""
                                            style="
                                              outline: none;
                                              text-decoration: none;
                                              -ms-interpolation-mode: bicubic;
                                              clear: both;
                                              display: inline-block !important;
                                              border: none;
                                              height: auto;
                                              float: none;
                                              width: 12%;
                                              max-width: 25.6px;
                                            "
                                            width="25.6"
                                            class="v-src-width v-src-max-width"
                                          />
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
    
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <div
                                      class="v-text-align"
                                      style="
                                        font-size: 14px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                      "
                                    >
                                      <p style="line-height: 140%">
                                        <span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjE0NzAyNzEyNTAsImRhdGFUeXBlIjoic2NlbmUifQo=(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjExMzMxMTQxODksImRhdGFUeXBlIjoic2NlbmUifQo=(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span style="line-height: 19.6px"
                                          >Over 90 million establishments in 210
                                          countries and territories accept your
                                          Stable® card.</span
                                        >
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
                      <!--[if (mso)|(IE)]><td align="center" width="233" class="v-col-padding" style="width: 233px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-33p33"
                        style="
                          max-width: 320px;
                          min-width: 233.33px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <table
                                      width="100%"
                                      cellpadding="0"
                                      cellspacing="0"
                                      border="0"
                                    >
                                      <tr>
                                        <td
                                          class="v-text-align"
                                          style="
                                            padding-right: 0px;
                                            padding-left: 0px;
                                          "
                                          align="left"
                                        >
                                          <img
                                            align="left"
                                            border="0"
                                            src="https://assets.unlayer.com/projects/0/1721049040024-Group%20310.png"
                                            alt=""
                                            title=""
                                            style="
                                              outline: none;
                                              text-decoration: none;
                                              -ms-interpolation-mode: bicubic;
                                              clear: both;
                                              display: inline-block !important;
                                              border: none;
                                              height: auto;
                                              float: none;
                                              width: 15%;
                                              max-width: 32px;
                                            "
                                            width="32"
                                            class="v-src-width v-src-max-width"
                                          />
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
    
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <div
                                      class="v-text-align"
                                      style="
                                        font-size: 14px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                      "
                                    >
                                      <p style="line-height: 140%">
                                        <span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjE5MzAxMzY1NTksImRhdGFUeXBlIjoic2NlbmUifQo=(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span style="line-height: 19.6px"
                                          >Add your card to:</span
                                        >
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
    
                            <table
                              id="u_content_image_7"
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <table
                                      width="100%"
                                      cellpadding="0"
                                      cellspacing="0"
                                      border="0"
                                    >
                                      <tr>
                                        <td
                                          class="v-text-align"
                                          style="
                                            padding-right: 0px;
                                            padding-left: 0px;
                                          "
                                          align="center"
                                        >
                                          <img
                                            align="center"
                                            border="0"
                                            src="https://assets.unlayer.com/projects/0/1721049247032-Apple_Pay_Mark_RGB_041619%201.png"
                                            alt=""
                                            title=""
                                            style="
                                              outline: none;
                                              text-decoration: none;
                                              -ms-interpolation-mode: bicubic;
                                              clear: both;
                                              display: inline-block !important;
                                              border: none;
                                              height: auto;
                                              float: none;
                                              width: 30%;
                                              max-width: 64px;
                                            "
                                            width="64"
                                            class="v-src-width v-src-max-width"
                                          />
                                          <img
                                            align="center"
                                            border="0"
                                            src="https://assets.unlayer.com/projects/0/1721049258910-google-pay-mark_800%201.png"
                                            alt=""
                                            title=""
                                            style="
                                              outline: none;
                                              text-decoration: none;
                                              -ms-interpolation-mode: bicubic;
                                              clear: both;
                                              display: inline-block !important;
                                              border: none;
                                              height: auto;
                                              float: none;
                                              width: 49%;
                                              max-width: 104.53px;
                                            "
                                            width="104.53"
                                            class="v-src-width v-src-max-width"
                                          />
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
    
                            <table
                              id="u_content_image_8"
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <table
                                      width="100%"
                                      cellpadding="0"
                                      cellspacing="0"
                                      border="0"
                                    >
                                      <tr>
                                        <td
                                          class="v-text-align"
                                          style="
                                            padding-right: 0px;
                                            padding-left: 0px;
                                          "
                                          align="center"
                                        ></td>
                                      </tr>
                                    </table>
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: transparent;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: transparent;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="700" class="v-col-padding" style="width: 700px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-100"
                        style="
                          max-width: 320px;
                          min-width: 700px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              id="u_content_heading_5"
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 40px 10px 10px 50px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <!--[if mso]><table width="100%"><tr><td><![endif]-->
                                    <h1
                                      class="v-text-align"
                                      style="
                                        margin: 0px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                        font-size: 22px;
                                        font-weight: 400;
                                      "
                                    >
                                      <span
                                        ><span
                                          ><span
                                            data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjkxNDY1ODUwNywiZGF0YVR5cGUiOiJzY2VuZSJ9Cg==(/figmeta)--&gt;"
                                          ></span>
                                          <span
                                            >Simple steps to activate your
                                            card</span
                                          ></span
                                        ></span
                                      >
                                    </h1>
                                    <!--[if mso]></td></tr></table><![endif]-->
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row no-stack"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: transparent;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: transparent;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="177" class="v-col-padding" style="width: 177px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-25p29"
                        style="
                          max-width: 320px;
                          min-width: 177.03px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <!--[if mso]><table width="100%"><tr><td><![endif]-->
                                    <h1
                                      class="v-text-align"
                                      style="
                                        margin: 0px;
                                        color: #d385d6;
                                        line-height: 140%;
                                        text-align: right;
                                        word-wrap: break-word;
                                        font-family: Ubuntu;
                                        font-size: 50px;
                                        font-weight: 400;
                                      "
                                    >
                                      <span><span>01</span></span>
                                    </h1>
                                    <!--[if mso]></td></tr></table><![endif]-->
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
                      <!--[if (mso)|(IE)]><td align="center" width="522" class="v-col-padding" style="width: 522px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-74p71"
                        style="
                          max-width: 320px;
                          min-width: 522.97px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 34px 0px 34px 20px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <div
                                      class="v-text-align"
                                      style="
                                        font-size: 14px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                      "
                                    >
                                      <p style="line-height: 140%">
                                        <span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjQxNjQ2MzYwNSwiZGF0YVR5cGUiOiJzY2VuZSJ9Cg==(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span style="line-height: 19.6px"
                                          >Open your Stable® app.</span
                                        >
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: transparent;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: transparent;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="700" class="v-col-padding" style="width: 700px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-100"
                        style="
                          max-width: 320px;
                          min-width: 700px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <table
                                      height="0px"
                                      align="center"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="69%"
                                      style="
                                        border-collapse: collapse;
                                        table-layout: fixed;
                                        border-spacing: 0;
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                        vertical-align: top;
                                        border-top: 1px dashed #bbbbbb;
                                        -ms-text-size-adjust: 100%;
                                        -webkit-text-size-adjust: 100%;
                                      "
                                    >
                                      <tbody>
                                        <tr style="vertical-align: top">
                                          <td
                                            style="
                                              word-break: break-word;
                                              border-collapse: collapse !important;
                                              vertical-align: top;
                                              font-size: 0px;
                                              line-height: 0px;
                                              mso-line-height-rule: exactly;
                                              -ms-text-size-adjust: 100%;
                                              -webkit-text-size-adjust: 100%;
                                            "
                                          >
                                            <span>&#160;</span>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row no-stack"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: transparent;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: transparent;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="177" class="v-col-padding" style="width: 177px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-25p29"
                        style="
                          max-width: 320px;
                          min-width: 177.03px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <!--[if mso]><table width="100%"><tr><td><![endif]-->
                                    <h1
                                      class="v-text-align"
                                      style="
                                        margin: 0px;
                                        color: #d385d6;
                                        line-height: 140%;
                                        text-align: right;
                                        word-wrap: break-word;
                                        font-family: Ubuntu;
                                        font-size: 50px;
                                        font-weight: 400;
                                      "
                                    >
                                      <span><span>02</span></span>
                                    </h1>
                                    <!--[if mso]></td></tr></table><![endif]-->
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
                      <!--[if (mso)|(IE)]><td align="center" width="522" class="v-col-padding" style="width: 522px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-74p71"
                        style="
                          max-width: 320px;
                          min-width: 522.97px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 34px 0px 34px 20px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <div
                                      class="v-text-align"
                                      style="
                                        font-size: 14px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                      "
                                    >
                                      <p style="line-height: 140%">
                                        <span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjQxNjQ2MzYwNSwiZGF0YVR5cGUiOiJzY2VuZSJ9Cg==(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjk2MDgzNzI0NywiZGF0YVR5cGUiOiJzY2VuZSJ9Cg==(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span style="line-height: 19.6px"
                                          >Go to the 'Card' section and click on the
                                          'Activate Card' button.</span
                                        >
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: transparent;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: transparent;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="700" class="v-col-padding" style="width: 700px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-100"
                        style="
                          max-width: 320px;
                          min-width: 700px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <table
                                      height="0px"
                                      align="center"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="69%"
                                      style="
                                        border-collapse: collapse;
                                        table-layout: fixed;
                                        border-spacing: 0;
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                        vertical-align: top;
                                        border-top: 1px dashed #bbbbbb;
                                        -ms-text-size-adjust: 100%;
                                        -webkit-text-size-adjust: 100%;
                                      "
                                    >
                                      <tbody>
                                        <tr style="vertical-align: top">
                                          <td
                                            style="
                                              word-break: break-word;
                                              border-collapse: collapse !important;
                                              vertical-align: top;
                                              font-size: 0px;
                                              line-height: 0px;
                                              mso-line-height-rule: exactly;
                                              -ms-text-size-adjust: 100%;
                                              -webkit-text-size-adjust: 100%;
                                            "
                                          >
                                            <span>&#160;</span>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row no-stack"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: transparent;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: transparent;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="177" class="v-col-padding" style="width: 177px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-25p29"
                        style="
                          max-width: 320px;
                          min-width: 177.03px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <!--[if mso]><table width="100%"><tr><td><![endif]-->
                                    <h1
                                      class="v-text-align"
                                      style="
                                        margin: 0px;
                                        color: #d385d6;
                                        line-height: 140%;
                                        text-align: right;
                                        word-wrap: break-word;
                                        font-family: Ubuntu;
                                        font-size: 50px;
                                        font-weight: 400;
                                      "
                                    >
                                      <span
                                        ><span><span>03</span></span></span
                                      >
                                    </h1>
                                    <!--[if mso]></td></tr></table><![endif]-->
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
                      <!--[if (mso)|(IE)]><td align="center" width="522" class="v-col-padding" style="width: 522px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-74p71"
                        style="
                          max-width: 320px;
                          min-width: 522.97px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 34px 0px 34px 20px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <div
                                      class="v-text-align"
                                      style="
                                        font-size: 14px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                      "
                                    >
                                      <p style="line-height: 140%">
                                        <span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjQxNjQ2MzYwNSwiZGF0YVR5cGUiOiJzY2VuZSJ9Cg==(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjU0MzI1MzY3OCwiZGF0YVR5cGUiOiJzY2VuZSJ9Cg==(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span style="line-height: 19.6px"
                                          >Enter the last 4 digits of your physical
                                          card.</span
                                        >
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: transparent;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: transparent;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="700" class="v-col-padding" style="width: 700px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-100"
                        style="
                          max-width: 320px;
                          min-width: 700px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <table
                                      height="0px"
                                      align="center"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      width="69%"
                                      style="
                                        border-collapse: collapse;
                                        table-layout: fixed;
                                        border-spacing: 0;
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                        vertical-align: top;
                                        border-top: 1px dashed #bbbbbb;
                                        -ms-text-size-adjust: 100%;
                                        -webkit-text-size-adjust: 100%;
                                      "
                                    >
                                      <tbody>
                                        <tr style="vertical-align: top">
                                          <td
                                            style="
                                              word-break: break-word;
                                              border-collapse: collapse !important;
                                              vertical-align: top;
                                              font-size: 0px;
                                              line-height: 0px;
                                              mso-line-height-rule: exactly;
                                              -ms-text-size-adjust: 100%;
                                              -webkit-text-size-adjust: 100%;
                                            "
                                          >
                                            <span>&#160;</span>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row no-stack"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: transparent;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: transparent;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="177" class="v-col-padding" style="width: 177px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-25p29"
                        style="
                          max-width: 320px;
                          min-width: 177.03px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <!--[if mso]><table width="100%"><tr><td><![endif]-->
                                    <h1
                                      class="v-text-align"
                                      style="
                                        margin: 0px;
                                        color: #d385d6;
                                        line-height: 140%;
                                        text-align: right;
                                        word-wrap: break-word;
                                        font-family: Ubuntu;
                                        font-size: 50px;
                                        font-weight: 400;
                                      "
                                    >
                                      <span
                                        ><span
                                          ><span><span>04</span></span></span
                                        ></span
                                      >
                                    </h1>
                                    <!--[if mso]></td></tr></table><![endif]-->
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
                      <!--[if (mso)|(IE)]><td align="center" width="522" class="v-col-padding" style="width: 522px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-74p71"
                        style="
                          max-width: 320px;
                          min-width: 522.97px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 34px 0px 34px 20px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <div
                                      class="v-text-align"
                                      style="
                                        font-size: 14px;
                                        line-height: 140%;
                                        text-align: left;
                                        word-wrap: break-word;
                                      "
                                    >
                                      <p style="line-height: 140%">
                                        <span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjQxNjQ2MzYwNSwiZGF0YVR5cGUiOiJzY2VuZSJ9Cg==(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span
                                          data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjE1Mjk4ODMwNjEsImRhdGFUeXBlIjoic2NlbmUifQo=(/figmeta)--&gt;"
                                          style="line-height: 19.6px"
                                        ></span
                                        ><span style="line-height: 19.6px"
                                          >Create a PIN and you're good to go!</span
                                        >
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
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 700px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: transparent;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: transparent;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="700" class="v-col-padding" style="width: 700px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-100"
                        style="
                          max-width: 320px;
                          min-width: 700px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!--><div
                            class="v-col-padding"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          ><!--<![endif]-->
                            <table
                              id="u_content_button_1"
                              style="font-family: Ubuntu"
                              role="presentation"
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              border="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    class="v-container-padding-padding"
                                    style="
                                      overflow-wrap: break-word;
                                      word-break: break-word;
                                      padding: 10px 10px 10px 70px;
                                      font-family: Ubuntu;
                                    "
                                    align="left"
                                  >
                                    <!--[if mso
                                      ]><style>
                                        .v-button {
                                          background: transparent !important;
                                        }
                                      </style><!
                                    [endif]-->
                                    <div class="v-text-align" align="left">
                                      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="" style="height:47px; v-text-anchor:middle; width:200px;" arcsize="0%"  stroke="f" fillcolor="#d385d6"><w:anchorlock/><center style="color:#000000;"><![endif]-->
                                      <a
                                        href=""
                                        target="_blank"
                                        class="v-button"
                                        style="
                                          box-sizing: border-box;
                                          display: inline-block;
                                          text-decoration: none;
                                          -webkit-text-size-adjust: none;
                                          text-align: center;
                                          color: #000000;
                                          background-color: #d385d6;
                                          border-radius: 0px;
                                          -webkit-border-radius: 0px;
                                          -moz-border-radius: 0px;
                                          width: auto;
                                          max-width: 100%;
                                          overflow-wrap: break-word;
                                          word-break: break-word;
                                          word-wrap: break-word;
                                          mso-border-alt: none;
                                          font-size: 16px;
                                        "
                                      >
                                        <span
                                          style="
                                            display: block;
                                            padding: 14px 26px;
                                            line-height: 120%;
                                          "
                                          ><span
                                            data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieUJsZGZic21FOUlONndwSVBWeDA2SCIsInBhc3RlSUQiOjE2MjQ5MDk4NDQsImRhdGFUeXBlIjoic2NlbmUifQo=(/figmeta)--&gt;"
                                            style="line-height: 19.2px"
                                          ></span
                                          ><span style="line-height: 19.2px"
                                            >Activate it right now.</span
                                          ></span
                                        >
                                      </a>
                                      <!--[if mso]></center></v:roundrect><![endif]-->
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
                                          <div class="u-row" style="margin: 0 auto;min-width: 320px;max-width: 700px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
                                            <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
                                              <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:700px;"><tr style="background-color: transparent;"><![endif]-->
                              
                                              <!--[if (mso)|(IE)]><td align="center" width="700" class="v-col-padding" style="width: 700px;padding: 0px 0px 0px 40px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                                              <div id="u_column_19" class="u-col u-col-100" style="max-width: 320px;min-width: 700px;display: table-cell;vertical-align: top;">
                                                <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                                  <!--[if (!mso)&(!IE)]><!-->
                                                  <div class="v-col-padding" style="box-sizing: border-box; height: 100%; padding: 0px 0px 0px 40px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                                                    <!--<![endif]-->
                              
                                                    <table id="u_content_text_8" style="font-family:'Source Sans Pro',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                                      <tbody>
                                                        <tr>
                                                          <td class="v-container-padding-padding" style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Source Sans Pro',sans-serif;" align="left">
                              
                                                            <div class="v-text-align" style="font-size: 12.5px; line-height: 140%; text-align: left; word-wrap: break-word;">
                                                              <p style="line-height: 140%;"><span data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieHhIT0c4cUJ5MlNSTXU3MDVHaDFlUCIsInBhc3RlSUQiOjY2MDc2MDIyNSwiZGF0YVR5cGUiOiJzY2VuZSJ9Cg==(/figmeta)--&gt;" style="line-height: 19.6px;"></span><span data-metadata="&lt;!--(figmeta)eyJmaWxlS2V5IjoieHhIT0c4cUJ5MlNSTXU3MDVHaDFlUCIsInBhc3RlSUQiOjEzMjUwNDM5MDcsImRhdGFUeXBlIjoic2NlbmUifQo=(/figmeta)--&gt;" style="line-height: 19.6px;"></span><span style="line-height: 19.6px;">Remember, we are here for you whenever you need us. You can write to us at</span></p>
                              <p style="line-height: 140%;"><span style="line-height: 19.6px;"><a rel="noopener" href="mailto:clients@stable-app.com" target="_blank">clients@stable-app.com</a></span></p></br>
                                                              
                                                              <p style="line-height: 140%;">
                                                              <span style="line-height: 19.6px;">Stable® Team</span></span></p>
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
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
                <div
                  class="u-row-container"
                  style="padding: 0px; background-color: transparent"
                >
                  <div
                    class="u-row"
                    style="
                      margin: 0 auto;
                      min-width: 320px;
                      max-width: 600px;
                      overflow-wrap: break-word;
                      word-wrap: break-word;
                      word-break: break-word;
                      background-color: transparent;
                    "
                  >
                    <div
                      style="
                        border-collapse: collapse;
                        display: table;
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                      "
                    >
                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:600px;"><tr style="background-color: transparent;"><![endif]-->
    
                      <!--[if (mso)|(IE)]><td align="center" width="600" class="v-col-padding v-col-border" style="width: 600px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
                      <div
                        class="u-col u-col-100"
                        style="
                          max-width: 320px;
                          min-width: 600px;
                          display: table-cell;
                          vertical-align: top;
                        "
                      >
                        <div
                          style="
                            height: 100%;
                            width: 100% !important;
                            border-radius: 0px;
                            -webkit-border-radius: 0px;
                            -moz-border-radius: 0px;
                          "
                        >
                          <!--[if (!mso)&(!IE)]><!-->
                          <div
                            class="v-col-padding v-col-border"
                            style="
                              box-sizing: border-box;
                              height: 100%;
                              padding: 0px;
                              border-top: 0px solid transparent;
                              border-left: 0px solid transparent;
                              border-right: 0px solid transparent;
                              border-bottom: 0px solid transparent;
                              border-radius: 0px;
                              -webkit-border-radius: 0px;
                              -moz-border-radius: 0px;
                            "
                          >
                            <!--<![endif]-->
    
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
    
    
                <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
              </td>
            </tr>
          </tbody>
        </table>
        <!--[if mso]></div><![endif]-->
        <!--[if IE]></div><![endif]-->
      </body>
    </html>
    `;
    return html;
};
export default ActivateCardTemplate;
