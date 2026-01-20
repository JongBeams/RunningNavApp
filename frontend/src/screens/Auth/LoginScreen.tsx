import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {colors, commonStyles, spacing, fontSize, borderRadius} from '../../styles';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../types/navigation';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {login} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({email: '', password: ''});

  /**
   * 입력값 검증
   */
  const validateInputs = (): boolean => {
    const newErrors = {email: '', password: ''};
    let isValid = true;

    // 이메일 검증
    if (!email) {
      newErrors.email = '이메일을 입력해주세요';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '유효한 이메일 형식이 아닙니다';
      isValid = false;
    }

    // 비밀번호 검증
    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * 로그인 처리
   */
  const handleLogin = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // 로그인 성공 시 AuthContext에서 자동으로 인증 상태 변경
      // RootNavigator에서 자동으로 메인 화면으로 전환됨
    } catch (error: any) {
      console.error('[LoginScreen] 로그인 실패:', error);

      let errorMessage = '로그인에 실패했습니다.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 회원가입 화면으로 이동
   */
  const goToSignup = () => {
    navigation.navigate('Signup');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* 로고 또는 타이틀 */}
        <View style={styles.header}>
          <Text style={styles.title}>RunRun</Text>
          <Text style={styles.subtitle}>러닝 네비게이션</Text>
        </View>

        {/* 로그인 폼 */}
        <View style={styles.form}>
          {/* 이메일 입력 */}
          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>이메일</Text>
            <TextInput
              style={[commonStyles.input, errors.email ? commonStyles.inputError : null]}
              placeholder="example@email.com"
              placeholderTextColor={colors.gray}
              value={email}
              onChangeText={text => {
                setEmail(text);
                setErrors(prev => ({...prev, email: ''}));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
            {errors.email ? (
              <Text style={commonStyles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* 비밀번호 입력 */}
          <View style={styles.inputContainer}>
            <Text style={commonStyles.label}>비밀번호</Text>
            <TextInput
              style={[
                commonStyles.input,
                errors.password ? commonStyles.inputError : null,
              ]}
              placeholder="8자 이상 입력"
              placeholderTextColor={colors.gray}
              value={password}
              onChangeText={text => {
                setPassword(text);
                setErrors(prev => ({...prev, password: ''}));
              }}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
            {errors.password ? (
              <Text style={commonStyles.errorText}>{errors.password}</Text>
            ) : null}
          </View>

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={[styles.button, isLoading ? styles.buttonDisabled : null]}
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>로그인</Text>
            )}
          </TouchableOpacity>

          {/* 회원가입 링크 */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>계정이 없으신가요? </Text>
            <TouchableOpacity onPress={goToSignup} disabled={isLoading}>
              <Text style={styles.signupLink}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl + spacing.sm,
  },
  title: {
    fontSize: fontSize.display + 4,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.gray,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  // label → commonStyles.label 사용
  // input → commonStyles.input 사용
  // inputError → commonStyles.inputError 사용
  // errorText → commonStyles.errorText 사용
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.white,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  signupText: {
    fontSize: fontSize.sm,
    color: colors.gray,
  },
  signupLink: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default LoginScreen;
