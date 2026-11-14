import { useState, useEffect } from 'react';
import './LoginPage.css';
import { Icon } from '../../components/common/Icons';
import { loginAccount, registerAccount } from '../../services/api';

export const LoginPage = ({ onLoginSuccess, onRegisterSuccess, onDemoLogin, initialError }) => {
  const [theme, setTheme] = useState('light'); // Default to Light Mode
  const [viewState, setViewState] = useState('login'); // 'login' | 'register'
  
  // Login fields
  const [arnNumber, setArnNumber] = useState('');
  const [password, setPassword] = useState('');

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regFirm, setRegFirm] = useState('');
  const [regArn, setRegArn] = useState('');
  const [regEuin, setRegEuin] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regType, setRegType] = useState('Individual MFD');

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await loginAccount({ arn: arnNumber, password });
      onLoginSuccess(response);
    } catch (error) {
      setErrorMsg(error.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    setLoading(true);
    try {
      const response = await registerAccount({
        name: regName,
        email: regEmail,
        password: regPassword,
        arn: regArn,
        euin: regEuin,
        firmName: regFirm,
        phone: regMobile,
        accountType: regType,
      });
      onRegisterSuccess(response);
    } catch (error) {
      setErrorMsg(error.message || 'Account registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg('');
    setDemoLoading(true);
    try {
      await onDemoLogin();
    } catch (error) {
      setErrorMsg(error.message || 'The demo workspace could not be prepared.');
      setDemoLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background Orbs */}
      <div className="bg-glow-orb bg-glow-1"></div>
      <div className="bg-glow-orb bg-glow-2"></div>

      {/* Top Theme Switcher on Login */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20 }}>
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          <Icon name={theme === 'light' ? 'moon' : 'sun'} size={14} />
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>

      <div className="login-card" style={{ maxWidth: viewState === 'register' ? '540px' : '460px' }}>
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-logo">
            <Icon name="bot" size={30} color="#fff" />
          </div>
          <div>
            <h1>MFD Brokerage Analytic AI Agent</h1>
            <p>
              {viewState === 'login' 
                ? 'Sign in to access distributor analytics & AI copilot' 
                : 'Register your AMFI ARN to onboard your mutual fund distribution practice'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="badge badge-danger" style={{ padding: '8px 12px', width: '100%', justifyContent: 'center' }}>
            <Icon name="alert" size={14} />
            <span>{errorMsg}</span>
          </div>
        )}
        {!errorMsg && initialError && (
          <div className="badge badge-danger" role="alert" style={{ padding: '8px 12px', width: '100%', justifyContent: 'center' }}>
            <Icon name="alert" size={14} />
            <span>{initialError}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {viewState === 'login' ? (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">AMFI Registration Number (ARN)</label>
              <div className="input-with-icon">
                <span className="input-icon-left">
                  <Icon name="shield" size={16} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ARN-189422"
                  value={arnNumber}
                  onChange={(e) => setArnNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">Password</label>
                <button
                  type="button"
                  className="forgot-link"
                  style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}
                  onClick={() => setErrorMsg('Password reset is not configured yet. Contact your administrator.')}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="input-with-icon">
                <span className="input-icon-left">
                  <Icon name="settings" size={16} />
                </span>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading ? (
                <span>Verifying account...</span>
              ) : (
                <>
                  <Icon name="zap" size={16} color="#fff" />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>

            <div className="demo-login-divider" aria-hidden="true"><span>or preview the app</span></div>
            <button
              type="button"
              className="btn-demo-fill"
              onClick={handleDemoLogin}
              disabled={loading || demoLoading || !onDemoLogin}
            >
              <Icon name="dashboard" size={16} />
              <span>{demoLoading ? 'Preparing demo workspace…' : 'Continue with demo account'}</span>
            </button>
            <p className="demo-login-note">
              Uses clearly labeled sample data in this browser. No real account or backend connection is created.
            </p>

            <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Don't have an account?{' '}
              <button
                type="button"
                style={{ color: 'var(--primary-light)', fontWeight: '700', textDecoration: 'underline' }}
                onClick={() => { setViewState('register'); setErrorMsg(''); }}
              >
                Register New MFD Account
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form className="login-form" onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Distributor Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. Ramesh Patel"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Firm / Agency Name</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. Patel Wealth Advisory"
                  value={regFirm}
                  onChange={(e) => setRegFirm(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">AMFI ARN Number *</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. ARN-204519"
                  value={regArn}
                  onChange={(e) => setRegArn(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">EUIN Number</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. E412093"
                  value={regEuin}
                  onChange={(e) => setRegEuin(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="name@agency.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="form-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="+91 98765 43210"
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Create Password *</label>
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="At least 12 characters"
                  minLength={12}
                  maxLength={72}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  minLength={12}
                  maxLength={72}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Distributor Category</label>
                <select
                  className="form-input"
                  style={{ paddingLeft: '14px', background: 'var(--bg-input)' }}
                  value={regType}
                  onChange={(e) => setRegType(e.target.value)}
                >
                  <option value="Individual MFD">Individual MFD</option>
                  <option value="Corporate Distributor">Corporate Distributor</option>
                  <option value="RIA Partner">SEBI RIA Partner</option>
                  <option value="Sub-Broker">Sub-Broker / ND</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-login-submit" disabled={loading}>
              {loading ? (
                <span>Registering AMFI Profile...</span>
              ) : (
                <>
                  <Icon name="check" size={16} color="#fff" />
                  <span>Create Account & Open Dashboard</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Already registered?{' '}
              <button
                type="button"
                style={{ color: 'var(--primary-light)', fontWeight: '700', textDecoration: 'underline' }}
                onClick={() => { setViewState('login'); setErrorMsg(''); }}
              >
                Sign In to Existing Account
              </button>
            </div>
          </form>
        )}

        {/* Security / Regulatory Footer */}
        <div className="login-footer-security">
          <Icon name="shield" size={14} color="var(--success)" />
          <span>Passwords are hashed • Reports are private to your account</span>
        </div>
      </div>
    </div>
  );
};
