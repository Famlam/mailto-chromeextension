# How to add a custom URL #

## Introduction ##

Although there are some default email clients listed on the options page, there is a chance that the one you use isn't listed there. In that case, you might want to create your own URL.

## What do I need to know ##

Basically, all you need to know is the URL that is used by the email server to compose a new email _from so called query parameters_. Sounds easy, but it often requires some searching, and not all email providers do support this.

## What is the syntax ##
The syntax is not very difficult. Once you know the URL described above, you need to tell the extension in which parts of that URL certain information (such as the `to` and `subject` lines) should be put. These are the parameters that you may use and what they are replaced with:

 * **`{url}`** inserts the full mailto: URL that you clicked at that position of the URL
 * **`{to}`** inserts the address(es) that will be in the _to_ field of the newly composed email
 * **`{cc}`** inserts the address(es) that will be in the _cc_ field of the newly composed email
 * **`{bcc}`** inserts the address(es) that will be in the _bcc_ field of the newly composed email
 * **`{subject}`** inserts the subject of the newly composed email
 * **`{body}`** inserts the body of the newly composed email

Not all email providers support all of the above parameters. An URL must at least contain:
  1. A valid URL (http:// or https://)
  1. Either `{to}` or `{url}`
  
So if your email provider uses the following compose URL
`http://e.mail.com/compose?To=[here should be the 'to' addresses]&CC=[here should be the 'cc' addresses]`
the correct URL to use within the extension would be
`http://e.mail.com/compose?To={to}&CC={cc}`.

## Examples ##
Do you have an example URL? Please share it with others by emailing me or commenting below!
Please note: the author of this extension is not affiliated with any of these companies.

##### AOL Mail #####
This email provider is build in by default.
```
http://mail.aol.com/33490-311/aim-6/en-us/mail/compose-message.aspx?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}
```

##### FastMail #####
This email provider is build in by default.
```
https://www.fastmail.fm/action/compose/?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}
```

##### Gmail #####
This email provider is build in by default.
```
https://mail.google.com/mail/?view=cm&tf=1&to={to}&cc={cc}&bcc={bcc}&su={subject}&body={body}
```

##### Godaddy #####
You must have your email address entered and "enable mailto: links" enabled in the Godaddy Workspace Desktop
```
http://email09.secureserver.net/webmail.php?login=1&compose=1&compose_args=sendto{to}
```

##### Hotmail #####
This email provider is build in by default.
```
https://mail.live.com/default.aspx?rru=compose&to={to}&subject={subject}&body={body}&cc={cc}
```

##### Mail.ru #####
```
http://win.mail.ru/cgi-bin/sentmsg?To={to}&CC={cc}&BCC={bcc}&Subject={subject}&BodyUTF8={body}&accel=1
```

##### Opera Web mail #####
```
http://mymail.operamail.com/scripts/mail/Outblaze.mail?compose=1&did=1&a=1&to={to}&subject={subject}&body={body}&cc={cc}
```

##### My Opera mail #####
This email provider is no longer active
```
https://mail.opera.com/action/compose/?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}
```

##### Outlook.com #####
This email provider is build in by default.
```
https://mail.live.com/default.aspx?rru=compose&to={to}&subject={subject}&body={body}&cc={cc}
```

##### Outlook Web Access #####
Replace `mail.server.com` by the domain you use when reading your mail
```
https://mail.server.com/owa/?ae=Item&a=New&t=IPM.Note&to={to}&subject={subject}&body={body}
```

##### Posteo #####
```
https://posteo.de/webmail/?_task=mail&_action=compose&_to={url}
```

##### Windows Live Mail #####
This email provider is build in by default.
```
https://mail.live.com/default.aspx?rru=compose&to={to}&subject={subject}&body={body}&cc={cc}
```

##### Yahoo Mail #####
This email provider is build in by default. There are two possible URLs, choose the one that works for you. In case of the latter, replace `server` by the server you use when reading your mail.
```
http://compose.mail.yahoo.com/?To={to}&Cc={cc}&Bcc={bcc}&Subj={subject}&Body={body}
https://server.mail.yahoo.com/neo/launch?action=compose&To={to}&Cc={cc}&Bcc={bcc}&Subj={subject}&Body={body}
```

##### Yandex Mail #####
```
http://mail.yandex.ru/compose?mailto={url}
```

##### Zimbra #####
Replace `mail.server.com` by the domain you use when reading your mail. Choose the one that works best for you.
```
https://mail.server.com/zimbra/mail?view=compose&subject={subject}&to={to}&cc={cc}&bcc={bcc}&body={body}
https://mail.server.com/h/search?action=compose&to={to}&subject={subject}&cc={cc}&bcc={bcc}&body={body}
```

##### Zoho Mail #####
This email provider is build in by default.
```
https://zmail.zoho.com/mail/compose.do?extsrc=mailto&mode=compose&tp=zb&ct={to}
```
