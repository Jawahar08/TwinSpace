import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';

interface AuthScreenProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string) => Promise<void>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await onRegister(email, password);
      } else {
        await onLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SN</Text>
          </View>
          <Text style={styles.title}>{isRegister ? 'Create Account' : 'SyncNotes'}</Text>
          <Text style={styles.subtitle}>Private real-time note sync for iPhone</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="user@example.com"
            placeholderTextColor="#86868B"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#86868B"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{isRegister ? 'Register' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 40 },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#E5A93C', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#F5F5F7' },
  subtitle: { fontSize: 13, color: '#98989D', marginTop: 4 },
  errorBox: { backgroundColor: 'rgba(255, 59, 48, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.3)', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: '#FF3B30', fontSize: 12, textAlign: 'center' },
  form: { width: '100%' },
  label: { color: '#98989D', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#2C2C2E', color: '#F5F5F7', padding: 14, borderRadius: 12, fontSize: 15, marginBottom: 16 },
  button: { backgroundColor: '#E5A93C', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { color: '#E5A93C', fontSize: 13 },
});
