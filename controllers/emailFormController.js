const nodemailer = require('nodemailer');
const fs = require("fs");
const path = require('path');

async function test(req, res) {
    return res.status(200).json({ msg: "Test" });
}

async function handler(req, res) {

    if (!req.body) {
        return res.status(400).json({ error: "body required" });
    }

    if (!req.files) {
        return res.status(400).json({ error: "files required" });
    }

    const body = req.body;
    const images = req.files;

    // console.log(images);

    //Configurar el objeto de transporte para enviar correos electrónicos
    const transporter = nodemailer.createTransport({
        // Configuración del servidor SMTP
        host: 'smtp.ipower.com',
        port: 465,
        secure: true,
        auth: {
            user: '',
            pass: '',
        },
        tls: { rejectUnauthorized: false }
    });

    try {
        // Enviar el correo electrónico
        const info = transporter.sendMail({
            // Configuración del correo electrónico
            from: '',
            to: '',
            subject: 'Apply form',
            html: `<div style="font-size: 10pt; font-family: Verdana,Geneva,sans-serif">
            <center>
        
                <table id="bodyTable"
                    style="border-collapse: collapse; height: 100%; margin: 0; padding: 0; width: 100%; background-color: #e9eaec"
                    border="0" width="100%" cellspacing="0" cellpadding="0" align="center">
                    <tbody>
                        <tr>
                            <td id="bodyCell" style="height: 100%; margin: 0; padding: 50px 50px; width: 100%" align="center"
                                valign="top">
                                <table style="border-collapse: collapse; border: 0; max-width: 600px!important" border="0"
                                    width="100%" cellspacing="0" cellpadding="0">
                                    <tbody>
                                        <tr>
                                            <td id="templateBody"
                                                style="background-color: #ffffff; border-top: 0; border: 1px solid #c1c1c1; padding-top: 0; padding-bottom: 0px"
                                                valign="top">
                                                <table style="min-width: 100%; border-collapse: collapse" border="0"
                                                    width="100%" cellspacing="0" cellpadding="0">
                                                    <tbody>
                                                        <tr>
                                                            <td style="mso-line-height-rule: exactly; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%"
                                                                valign="top">
                                                                <table style="min-width: 100%; border-collapse: collapse"
                                                                    border="0" width="100%" cellspacing="0" cellpadding="0"
                                                                    align="left">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td style="padding: 30px" valign="top">
                                                                                <table
                                                                                    style="display: block; min-width: 100%; border-collapse: collapse; width: 100%"
                                                                                    border="0" width="100%" cellspacing="0"
                                                                                    cellpadding="0" align="left">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td
                                                                                                style="color: #333333; padding-top: 20px; padding-bottom: 3px">
                                                                                                <strong>Full Name / Nombre
                                                                                                    Completo</strong>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td
                                                                                                style="color: #555555; padding-top: 3px; padding-bottom: 20px">
                                                                                                ${body.full_name}</td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                                <table
                                                                                    style="border-top: 1px solid #dddddd; display: block; min-width: 100%; border-collapse: collapse; width: 100%"
                                                                                    border="0" width="100%" cellspacing="0"
                                                                                    cellpadding="0" align="left">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td
                                                                                                style="color: #333333; padding-top: 20px; padding-bottom: 3px">
                                                                                                <strong>Photos</strong>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td
                                                                                                style="color: #555555; padding-top: 3px; padding-bottom: 20px">
                                                                                                <img
                                                                                                style="width: 600"
                                                                                                src="cid:photo" />
                                                                                            </td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                                <table
                                                                                    style="border-top: 1px solid #dddddd; display: block; min-width: 100%; border-collapse: collapse; width: 100%"
                                                                                    border="0" width="100%" cellspacing="0"
                                                                                    cellpadding="0" align="left">
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td
                                                                                                style="color: #333333; padding-top: 20px; padding-bottom: 3px">
                                                                                                <strong>YOU WILL BE CONTACTED
                                                                                                    ONCE YOUR REQUEST IS
                                                                                                    REVIEWED/SERÁ CONTACTADO UNA
                                                                                                    VEZ REVISADA SU
                                                                                                    SOLICITUD.</strong>
                                                                                            </td>
                                                                                        </tr>
                                                                                        <tr>
                                                                                            <td
                                                                                                style="color: #555555; padding-top: 3px; padding-bottom: 20px">
                                                                                                I have read and accept the
                                                                                                privacy policy/He leido y acepto
                                                                                                la poliza de privacidad.</td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td id="templateFooter"
                                                style="background-color: #e9eaec; border-top: 0; border-bottom: 0; padding-top: 12px; padding-bottom: 12px"
                                                valign="top">
                                                <table style="min-width: 100%; border-collapse: collapse" border="0"
                                                    width="100%" cellspacing="0" cellpadding="0">
                                                    <tbody>
                                                        <tr>
                                                            <td style="mso-line-height-rule: exactly; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%"
                                                                valign="top">
                                                                <table style="min-width: 100%; border-collapse: collapse"
                                                                    border="0" width="100%" cellspacing="0" cellpadding="0"
                                                                    align="left">
                                                                    <tbody>
                                                                        <tr>
                                                                            <td style="word-break: break-word; color: #aaa; font-family: Helvetica; font-size: 12px; line-height: 150%; text-align: center; padding: 9px 18px 9px 18px"
                                                                                valign="top">Sent from <a style="color: #bbbbbb"
                                                                                    href=""
                                                                                    rel="noreferrer" target="_blank">WS</a></td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
        
            </center>
        
        </div>`,
            attachments: [
                {
                    filename: `${images.face.originalFilename}`,
                    path: `./${images.face.path}`,
                    cid: 'photo'
                }
            ].filter(Boolean)
        }).then(() => {
            deleteSendedImages();
            return res.status(200).json({ message: 'Email sent successfully!' });
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error sending email' });
    }
}

function deleteSendedImages() {
    const directoryPath = 'assets/apply_form';

    fs.readdir(directoryPath, (err, files) => {
        if (err) throw err;

        // Si el array de archivos es vacío, no hay archivos en la ruta
        if (files.length === 0) {
            return;
        }

        for (const file of files) {
            fs.unlink(path.join(directoryPath, file), err => {
                if (err) throw err;
            });
        }
        return;
    });
}

module.exports = {
    handler,
    test,
    deleteSendedImages
}