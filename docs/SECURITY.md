# Security Policy

## Supported Versions

We release patches for security vulnerabilities. The following versions are currently supported:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of ngx-dice-captcha seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please DO NOT

- Open a public GitHub issue for security vulnerabilities
- Disclose the vulnerability publicly before it has been addressed

### Please DO

**Report security vulnerabilities via email to: security@easy-cloud.in**

Include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability and potential attack scenarios

### Response Timeline

- **Within 24 hours**: We will acknowledge receipt of your vulnerability report
- **Within 7 days**: We will provide a detailed response indicating the next steps
- **Within 30 days**: We aim to release a patch for confirmed vulnerabilities

## Security Best Practices

### For Library Users

1. **Always Validate on Backend**: Never trust CAPTCHA validation from the client side alone

   ```typescript
   // Frontend
   onCaptchaVerified(result: VerificationResult) {
     // Send token to backend for validation
     this.http.post('/api/verify-captcha', { token: result.token })
       .subscribe(response => {
         // Proceed only after backend validation
       });
   }
   ```

2. **Use HTTPS**: Always serve your application over HTTPS to prevent token interception

3. **Implement Rate Limiting**: Add server-side rate limiting to prevent abuse

   ```typescript
   // Example backend rate limiting
   const rateLimit = require('express-rate-limit');

   const captchaLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // limit each IP to 5 requests per windowMs
     message: 'Too many CAPTCHA attempts, please try again later',
   });

   app.post('/api/verify-captcha', captchaLimiter, (req, res) => {
     // Verify CAPTCHA token
   });
   ```

4. **Token Expiration**: Implement token expiration on your backend

   ```javascript
   function verifyCaptchaToken(token) {
     const payload = jwt.verify(token, SECRET_KEY);

     // Check if token is expired (e.g., 5 minutes)
     if (Date.now() - payload.timestamp > 5 * 60 * 1000) {
       throw new Error('Token expired');
     }

     return true;
   }
   ```

5. **Session Management**: Use secure session management

   - Generate unique session IDs for each CAPTCHA instance
   - Store session data securely on the backend
   - Clear expired sessions regularly

6. **Content Security Policy**: Configure CSP headers
   ```html
   <meta
     http-equiv="Content-Security-Policy"
     content="default-src 'self'; 
                  script-src 'self' 'unsafe-eval'; 
                  style-src 'self' 'unsafe-inline';"
   />
   ```

### For Library Developers

1. **Dependencies**: Keep all dependencies up to date

   ```bash
   npm audit
   npm update
   ```

2. **Input Validation**: Validate all configuration inputs

   ```typescript
   if (config.maxAttempts < 1 || config.maxAttempts > 10) {
     throw new Error('Invalid maxAttempts configuration');
   }
   ```

3. **XSS Prevention**: Sanitize all user inputs and outputs

   ```typescript
   import { DomSanitizer } from '@angular/platform-browser';

   constructor(private sanitizer: DomSanitizer) {}

   sanitizeInput(input: string): string {
     return this.sanitizer.sanitize(SecurityContext.HTML, input) || '';
   }
   ```

4. **Secure Random Generation**: Use cryptographically secure random numbers
   ```typescript
   // Already implemented in random.util.ts
   export function secureRandom(): number {
     return crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff;
   }
   ```

## Known Security Considerations

### Client-Side Validation Limitations

**Important**: This library performs CAPTCHA validation on the client side. While this provides a good user experience, it should **never** be the only security measure.

**Why this matters**:

- Determined attackers can bypass client-side validation
- JavaScript can be disabled or manipulated
- Browser developer tools can modify runtime behavior

**Solution**: Always implement server-side verification:

```javascript
// Backend example (Node.js/Express)
app.post('/api/verify-captcha', async (req, res) => {
  const { token, sessionId } = req.body;

  try {
    // 1. Verify token signature
    const payload = jwt.verify(token, process.env.CAPTCHA_SECRET);

    // 2. Check if token was already used (prevent replay attacks)
    const wasUsed = await tokenCache.get(token);
    if (wasUsed) {
      return res.status(400).json({ error: 'Token already used' });
    }

    // 3. Mark token as used
    await tokenCache.set(token, true, { EX: 600 }); // Expire in 10 minutes

    // 4. Verify session exists and is valid
    const session = await sessionStore.get(sessionId);
    if (!session || session.expired) {
      return res.status(400).json({ error: 'Invalid session' });
    }

    // 5. Check attempt count and timing
    if (session.attempts > 5) {
      return res.status(429).json({ error: 'Too many attempts' });
    }

    res.json({ success: true, verified: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid CAPTCHA token' });
  }
});
```

### WebGL Security

The library uses WebGL for 3D rendering. WebGL has some security considerations:

1. **Fingerprinting**: WebGL can be used for browser fingerprinting
2. **GPU Information**: WebGL exposes some GPU information
3. **Timing Attacks**: GPU rendering timing could potentially be exploited

**Mitigation**: These are inherent to WebGL and affect all WebGL applications. Users who are concerned can disable WebGL in their browsers, though this will prevent the CAPTCHA from working.

### Third-Party Dependencies

The library depends on:

- **Three.js**: Well-maintained 3D library with active security monitoring
- **Cannon-es**: Physics engine, actively maintained
- **Angular**: Framework with strong security practices

We regularly update these dependencies and monitor security advisories.

## Security Updates

Security updates are released as patch versions (e.g., 1.0.1, 1.0.2). We recommend:

1. **Subscribe to Releases**: Watch the GitHub repository for new releases
2. **Enable Dependabot**: Use GitHub Dependabot for automatic dependency updates
3. **Review CHANGELOG**: Check [`CHANGELOG.md`](../CHANGELOG.md) for security-related updates
4. **Update Promptly**: Apply security patches as soon as possible

## Vulnerability Disclosure Process

When we receive a security vulnerability report:

1. **Triage**: We assess the severity and impact
2. **Fix Development**: We develop a fix in a private repository
3. **Testing**: We thoroughly test the fix
4. **Release**: We release a new version with the security patch
5. **Disclosure**: We publish a security advisory with details

## Security Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

- No vulnerabilities reported yet

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Angular Security Guide](https://angular.io/guide/security)
- [Three.js Security](https://threejs.org/)
- [Web Application Security](https://cheatsheetseries.owasp.org/)

## Contact

For security concerns:

- **Email**: security@easy-cloud.in
- **GitHub**: Create a security advisory (not a public issue)

For general questions:

- **Email**: contact@easy-cloud.in
- **GitHub Issues**: For non-security bugs and features

---

**Remember**: Security is a shared responsibility. This library provides the tools, but proper implementation and backend validation are essential for a secure system.
