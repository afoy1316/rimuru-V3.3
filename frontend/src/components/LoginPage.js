import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = ({ onLogin, onRegister }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    username: "", 
    name: "",
    company_name: "",
    phone_number: "",
    address: "",
    city: "",
    province: "",
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [showPassword, setShowPassword] = useState({
    login: false,
    register: false,
    confirmPassword: false
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await onLogin(loginForm.username, loginForm.password);
      if (result.success) {
        toast.success(t('loginSuccess'));
      } else {
        toast.error(result.message || t('loginFailed'));
      }
    } catch (error) {
      // Check if error is maintenance mode (503 status with MAINTENANCE_MODE prefix)
      if (error.response?.status === 503) {
        const detail = error.response?.data?.detail || '';
        if (typeof detail === 'string' && detail.startsWith('MAINTENANCE_MODE:')) {
          // Redirect to maintenance page
          window.location.href = '/maintenance';
          return;
        }
      }
      toast.error(t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!registerForm.name.trim()) {
      toast.error(t('nameRequired') || 'Name is required');
      return;
    }
    
    if (!registerForm.phone_number.trim()) {
      toast.error(t('phoneRequired') || 'Phone number is required');
      return;
    }
    
    if (!registerForm.address.trim()) {
      toast.error(t('addressRequired') || 'Address is required');
      return;
    }
    
    if (!registerForm.city.trim()) {
      toast.error(t('cityRequired') || 'City is required');
      return;
    }
    
    if (!registerForm.province.trim()) {
      toast.error(t('provinceRequired') || 'Province is required');
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    if (registerForm.password.length < 6) {
      toast.error(t('passwordMinLength'));
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await onRegister(
        registerForm.username,
        registerForm.name,
        registerForm.company_name,
        registerForm.phone_number,
        registerForm.address,
        registerForm.city,
        registerForm.province,
        registerForm.email, 
        registerForm.password
      );
      if (result.success) {
        toast.success(result.message);
        const registeredUsername = registerForm.username;
        setRegisterForm({ 
          username: "", 
          name: "",
          company_name: "",
          phone_number: "",
          address: "",
          city: "",
          province: "",
          email: "", 
          password: "", 
          confirmPassword: "" 
        });
        // Pre-fill login form with registered username and redirect to login tab
        setLoginForm({ username: registeredUsername, password: "" });
        setTimeout(() => {
          setActiveTab("login");
        }, 1000); // Give 1 second for user to see success message
      } else {
        toast.error(result.message || t('registerFailed'));
      }
    } catch (error) {
      toast.error(t('registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 flex items-center justify-center bg-white rounded-xl shadow-lg border border-gray-100">
              <img 
                src="/images/rimuru-logo.png" 
                alt="Rimuru Logo" 
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('appName')}</h1>
          <p className="text-gray-600">{t('appTagline')}</p>
        </div>

        <Card className="glass-card border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center text-gray-900">{t('welcome')}</CardTitle>
            <CardDescription className="text-center text-gray-600">
              {t('loginToAccount')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                  data-testid="login-tab"
                >
                  {t('login')}
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-teal-600 data-[state=active]:text-white"
                  data-testid="register-tab"
                >
                  {t('register')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('username')}</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder={t('enterUsername')}
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      required
                      className="focus-ring"
                      data-testid="login-username-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('password')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword.login ? "text" : "password"}
                        placeholder={t('enterPassword')}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        className="focus-ring pr-10"
                        data-testid="login-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({...showPassword, login: !showPassword.login})}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword.login ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white btn-hover"
                    disabled={isLoading}
                    data-testid="login-submit-button"
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner mr-2"></div>
                        {t('loggingIn')}
                      </>
                    ) : (
                      t('login')
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">{t('username')}</Label>
                    <Input
                      id="reg-username"
                      type="text"
                      placeholder={t('enterUsername')}
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      required
                      className="focus-ring"
                      data-testid="register-username-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">{t('name') || 'Name'}</Label>
                    <Input
                      id="reg-name"
                      type="text"
                      placeholder={t('enterName') || 'Enter your full name'}
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                      className="focus-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-company">Nama Bisnis/Perusahaan (Opsional)</Label>
                    <Input
                      id="reg-company"
                      type="text"
                      placeholder="Masukkan nama bisnis atau perusahaan Anda"
                      value={registerForm.company_name}
                      onChange={(e) => setRegisterForm({ ...registerForm, company_name: e.target.value })}
                      className="focus-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">{t('phoneNumber') || 'Phone Number'}</Label>
                    <Input
                      id="reg-phone"
                      type="tel"
                      placeholder={t('enterPhoneNumber') || 'Enter phone number (e.g., 08123456789)'}
                      value={registerForm.phone_number}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone_number: e.target.value })}
                      required
                      className="focus-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-address">{t('address') || 'Address'}</Label>
                    <Input
                      id="reg-address"
                      type="text"
                      placeholder={t('enterAddress') || 'Enter your address'}
                      value={registerForm.address}
                      onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                      required
                      className="focus-ring"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-city">{t('city') || 'City'}</Label>
                      <Input
                        id="reg-city"
                        type="text"
                        placeholder={t('enterCity') || 'Enter city'}
                        value={registerForm.city}
                        onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                        required
                        className="focus-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-province">{t('province') || 'Province'}</Label>
                      <Input
                        id="reg-province"
                        type="text"
                        placeholder={t('enterProvince') || 'Enter province'}
                        value={registerForm.province}
                        onChange={(e) => setRegisterForm({ ...registerForm, province: e.target.value })}
                        required
                        className="focus-ring"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">{t('email')}</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder={t('enterEmail')}
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                      className="focus-ring"
                      data-testid="register-email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">{t('password')}</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showPassword.register ? "text" : "password"}
                        placeholder={t('passwordMinLength')}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                        className="focus-ring pr-10"
                        data-testid="register-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({...showPassword, register: !showPassword.register})}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword.register ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPassword.confirmPassword ? "text" : "password"}
                        placeholder={t('repeatPassword')}
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        required
                        className="focus-ring pr-10"
                        data-testid="register-confirm-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({...showPassword, confirmPassword: !showPassword.confirmPassword})}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword.confirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white btn-hover"
                    disabled={isLoading}
                    data-testid="register-submit-button"
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner mr-2"></div>
                        {t('registering')}
                      </>
                    ) : (
                      t('registerNow')
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>{t('termsAgreement')}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;