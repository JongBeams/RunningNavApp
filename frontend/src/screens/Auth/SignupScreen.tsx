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
import {colors} from '../../styles';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../types/navigation';

type SignupScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Signup'
>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

const SignupScreen: React.FC<Props> = ({navigation}) => {
  const {signup} = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    fullName: '',
    phone: '',
  });

  /**
   * 입력값 검증
   */
  const validateInputs = (): boolean => {
    const newErrors = {
      email: '',
      password: '',
      passwordConfirm: '',
      fullName: '',
      phone: '',
    };
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

    // 비밀번호 확인 검증
    if (!passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요';
      isValid = false;
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
      isValid = false;
    }

    // 이름 검증
    if (!fullName) {
      newErrors.fullName = '이름을 입력해주세요';
      isValid = false;
    }

    // 전화번호 검증
    if (!phone) {
      newErrors.phone = '전화번호를 입력해주세요';
      isValid = false;
    } else if (!/^[0-9]{10,11}$/.test(phone.replace(/-/g, ''))) {
      newErrors.phone = '유효한 전화번호 형식이 아닙니다';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * 회원가입 처리
   */
  const handleSignup = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        email,
        password,
        fullName,
        phone: phone.replace(/-/g, ''), // 하이픈 제거
      });

      // 회원가입 성공 시 AuthContext에서 자동으로 인증 상태 변경
      // RootNavigator에서 자동으로 메인 화면으로 전환됨
    } catch (error: any) {
      console.error('[SignupScreen] 회원가입 실패:', error);

      let errorMessage = '회원가입에 실패했습니다.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('회원가입 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 로그인 화면으로 이동
   */
  const goToLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>RunRun과 함께 달려보세요</Text>
        </View>

        {/* 회원가입 폼 */}
        <View style={styles.form}>
          {/* 이메일 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
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
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* 비밀번호 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={[
                styles.input,
                errors.password ? styles.inputError : null,
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
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>

          {/* 비밀번호 확인 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              style={[
                styles.input,
                errors.passwordConfirm ? styles.inputError : null,
              ]}
              placeholder="비밀번호 재입력"
              placeholderTextColor={colors.gray}
              value={passwordConfirm}
              onChangeText={text => {
                setPasswordConfirm(text);
                setErrors(prev => ({...prev, passwordConfirm: ''}));
              }}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
            {errors.passwordConfirm ? (
              <Text style={styles.errorText}>{errors.passwordConfirm}</Text>
            ) : null}
          </View>

          {/* 이름 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={[
                styles.input,
                errors.fullName ? styles.inputError : null,
              ]}
              placeholder="홍길동"
              placeholderTextColor={colors.gray}
              value={fullName}
              onChangeText={text => {
                setFullName(text);
                setErrors(prev => ({...prev, fullName: ''}));
              }}
              autoComplete="name"
              editable={!isLoading}
            />
            {errors.fullName ? (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            ) : null}
          </View>

          {/* 전화번호 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>전화번호</Text>
            <TextInput
              style={[styles.input, errors.phone ? styles.inputError : null]}
              placeholder="010-1234-5678"
              placeholderTextColor={colors.gray}
              value={phone}
              onChangeText={text => {
                setPhone(text);
                setErrors(prev => ({...prev, phone: ''}));
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
              editable={!isLoading}
            />
            {errors.phone ? (
              <Text style={styles.errorText}>{errors.phone}</Text>
            ) : null}
          </View>

          {/* 회원가입 버튼 */}
          <TouchableOpacity
            style={[styles.button, isLoading ? styles.buttonDisabled : null]}
            onPress={handleSignup}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>가입하기</Text>
            )}
          </TouchableOpacity>

          {/* 로그인 링크 */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={goToLogin} disabled={isLoading}>
              <Text style={styles.loginLink}>로그인</Text>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.black,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  loginText: {
    fontSize: 14,
    color: colors.gray,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default SignupScreen;
