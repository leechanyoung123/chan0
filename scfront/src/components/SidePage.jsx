import React, { useEffect, useState, useRef } from "react";
import { FaUserCircle, FaShoppingCart, FaSignOutAlt } from 'react-icons/fa';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/sidepage.css";
import "../css/login.css";
import "../css/signup.css";
import logoutImg from "../img/logout.gif";

import KakaoIcon from "../img/kakao.png";
import GoogleIcon from "../img/google.png";
import NaverIcon from "../img/naver.png";

const SidePage = () => {
  const nav = useNavigate();

  const postcodeRef = useRef(null);
  const roadAddressRef = useRef(null);
  const jibunAddressRef = useRef(null);
  const detailAddressRef = useRef(null);
  const extraAddressRef = useRef(null);
  const guideRef = useRef(null);

  const [authCode, setAuthCode] = useState(''); // 인증번호
  const [isAuthSuccess, setIsAuthSuccess] = useState(false); //인증 상태 여부
  const [authStep, setAuthStep] = useState("none");  // none, sending, input

  const [formData, setFormData] = useState({  // 회원가입시 저장되는 곳
    id: '',               // 아이디
    pw: '',         // 비밀번호
    name: '',             // 이름
    nickname: '',         // 닉네임
    phone: '',            // 핸드폰 번호
    email: '',            // 이메일 
    zipcode1: '',         // 우편 번호       ----------
    zipcode2: '',         // 도로명 주소      자동 입력
    address: '',          // 지번 주소       ----------
    detailAddress: '',    // 상세 주소      <--직접
  });
  const [showPassword, setShowPassword] = useState(false);                // 비밀번호 보기 상태 변경
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);  // 비밀번호확인 보기 상태 변경

  const [id, setId] = useState(''); // 일반 로그인 아이디
  const [pw, setPw] = useState(''); // 일반 로그인 비밀번호

  const [nickname, setNickname] = useState(null);       // 로그인 성공시 닉네임 
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // 상태 구별 -- 로그인(true), 로그아웃(false)
  const [loginType, setLoginType] = useState(null);     // 로그인한 방법 카카오("kakao") or 일반("basic")
  const [userInfo, setUserInfo] = useState(null);       // 로그인한 회원 정보 저장, 
  const [sdkReady, setSdkReady] = useState(false);      // 카톡 SDK 생성 여부 확인
  const [signUp, setSignUp] = useState(false);          // 가입하기 누를 때 상태를 구별하기 위한 변수

  useEffect(() => {  // Daum Postcode 스크립트를 동적으로 로드 (이미 로드되어 있다면 건너뜀)
    if (!window.daum || !window.daum.Postcode) {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  const sample4_execDaumPostcode = () => { // 우편번호 찾기 함수 실행
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function (data) {
          const roadAddr = data.roadAddress;
          let extraRoadAddr = "";

          if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
            extraRoadAddr += data.bname;
          }
          if (data.buildingName !== "" && data.apartment === "Y") {
            extraRoadAddr += (extraRoadAddr !== "" ? ", " + data.buildingName : data.buildingName);
          }
          if (extraRoadAddr !== "") {
            extraRoadAddr = " (" + extraRoadAddr + ")";
          }

          // 입력창에 값 넣기
          if (postcodeRef.current) postcodeRef.current.value = data.zonecode;
          if (roadAddressRef.current) roadAddressRef.current.value = roadAddr;
          if (jibunAddressRef.current) jibunAddressRef.current.value = data.jibunAddress;
          if (extraAddressRef.current) {
            extraAddressRef.current.value = roadAddr !== "" ? extraRoadAddr : "";
          }

          setFormData(prev => ({ // 저장하기
            ...prev,
            zipcode1: data.zonecode,
            zipcode2: roadAddr,
            address: data.jibunAddress,
          }));

          // 예상 주소 안내 텍스트 처리
          if (guideRef.current) {
            if (data.autoRoadAddress) {
              const expRoadAddr = data.autoRoadAddress + extraRoadAddr;
              guideRef.current.innerHTML = `(예상 도로명 주소 : ${expRoadAddr})`;
              guideRef.current.style.display = "block";
            } else if (data.autoJibunAddress) {
              const expJibunAddr = data.autoJibunAddress;
              guideRef.current.innerHTML = `(예상 지번 주소 : ${expJibunAddr})`;
              guideRef.current.style.display = "block";
            } else {
              guideRef.current.innerHTML = "";
              guideRef.current.style.display = "none";
            }
          }
        },
      }).open();
    } else {
      console.error("Daum Postcode SDK가 로드되지 않았습니다.");
    }
  };

  useEffect(() => { // 화면 실행시 Kakao SDK 스크립트 로딩 + 초기화

    const script = document.createElement("script");
    script.src = "https://developers.kakao.com/sdk/js/kakao.min.js";
    script.async = true;
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init("00914cc9a23cba2971cc435b1a14ba78"); // api 인증키
        setSdkReady(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {  // 새로고침시 Kakao 로그인 상태 유지
    if (window.Kakao && window.Kakao.Auth) {
      const saveUser = localStorage.getItem("kakaoUser");
      const token = window.Kakao.Auth.getAccessToken();

      if (saveUser && token) {
        const parsedUser = JSON.parse(saveUser);
        setUserInfo(parsedUser);
        setIsLoggedIn(true);
        setLoginType("kakao");
        setNickname(parsedUser.profile?.nickname);
      }
    }
  }, [sdkReady]);

  useEffect(() => { // 새로고침 시 일반 로그인 상태 유지
    const saved = localStorage.getItem("userInfo");

    if (saved) {
      const parsed = JSON.parse(saved);
      setUserInfo(parsed);
      setIsLoggedIn(true);
      setLoginType("basic");
      setNickname(parsed.nick || parsed.id); // 
    }
  }, []);

  const loginWithKakao = () => { //카카오톡 로그인 
    if (!sdkReady || !window.Kakao || !window.Kakao.Auth) {
      alert("요청이 많습니다 잠시후 시도해주세요");
      return;
    }
    window.Kakao.Auth.login({
      persistAccessToken: true,  // 카카오 토큰을 새로고침을 해도 삭제하지않음
      success: function (authObj) {
        window.Kakao.API.request({
          url: "/v2/user/me",
          success: function (res) {
            const kakaoAccount = res.kakao_account;
            console.log(kakaoAccount);
            setUserInfo(kakaoAccount);
            localStorage.setItem("kakaoUser", JSON.stringify(kakaoAccount));
            setIsLoggedIn(true);
            setLoginType("kakao");
            setNickname(kakaoAccount.profile?.nickname);

            axios.post("http://localhost:8083/controller/kakaologin", {
              id: kakaoAccount.email,
              name: kakaoAccount.profile?.nickname,
            }).then((response) => {
              if (response.data === 1) {
                alert("가입 성공");
              } else {
                alert("로그인 되었습니다.");
              }
            }).catch((err) => {
              console.error("Spring 연결 실패", err);
            });
          },
          fail: function (error) {
            console.error("사용자 정보 요청 실패:", error);
          },
        });
      },
      fail: function (err) {
        console.error("로그인 실패:", err);
      },
    });
  };

  const handleLogin = () => { // 일반 로그인 
    axios.post('http://localhost:8083/controller/login', { id, pw })
      .then(res => {
        console.log(res);
        if (res.data != "") {
          alert("로그인 완료");

          const userObj = res.data;

          localStorage.setItem("userInfo", JSON.stringify(userObj));

          setUserInfo(userObj);
          setIsLoggedIn(true);
          setLoginType("basic");
          setNickname(userObj.nick);

          setId("");
          setPw("");

          nav("/"); // 이건 성공 후에 실행하는 게 좋아!

        } else {
          alert("아이디나 비밀번호가 일치하지 않습니다.");
        }
      })
      .catch(err => {
        console.error("로그인 오류 잠시후 다시 시도해주세요", err);
      });


  };

  const handleLogout = () => { // 로그아웃 
    // 로그인 성공한게 카카오인지 일반인지 확인
    if (loginType === "kakao" && window.Kakao && window.Kakao.API) { // 카카오톡 로그아웃

      // 카카오톡 자동로그인 방지해주는 문구..  로그아웃 팝업창을 이용해 강제로 로그아웃
      const popup = window.open("", "kakaoLogout", "width=360,height=240,left=600,top=300");
      if (!popup) {
        alert("팝업이 차단되었습니다. 브라우저 팝업 설정을 확인해주세요.");
        return;
      }
      popup.document.write(`
    <html>
      <head>
        <title>로그아웃 중</title>
        <style>
          body {
            font-family: 'Noto Sans KR', sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #fffbe7;
            color: #333;
          }
          img {
            width: 80px;
            height: 80px;
            margin-bottom: 16px;
          }
          .message {
            font-size: 16px;
            font-weight: 500;
          }
          iframe {
            display: none;
          }
        </style>
      </head>
      <body>
        <img src="${logoutImg}" alt="로그아웃 중" />
        <div class="message">카카오에서 안전하게<br>로그아웃 중이에요 🍯🐝</div>
        <iframe src="https://accounts.kakao.com/logout?continue=https://kauth.kakao.com/oauth/logout"></iframe>
      </body>
    </html>
  `);

      // 팝업 닫기 (2초 후)
      setTimeout(() => {
        try {
          popup.close();
        } catch (e) {
          console.warn("팝업 닫기 실패:", e);
        }
      }, 2000);

      // 카카오 관련 데이터 모두 삭제
      window.Kakao.Auth.setAccessToken(undefined);
      localStorage.removeItem("kakaoUser");
      setUserInfo(null);
      setIsLoggedIn(false);
      setLoginType(null);
      setNickname(null);

      alert("로그아웃 되었습니다!");

    } else { // 일반 로그아웃
      localStorage.removeItem("userInfo"); // 저장된 로그인 정보 제거
      setUserInfo(null);
      setIsLoggedIn(false);
      setLoginType(null);
      setNickname(null);
      alert("로그아웃 되었습니다!");
    }

  };

  const signupGo = () => { // 회원가입 들어가기
    setSignUp(true);
  }

  const handleChange = (e) => { // 회원가입 입력시 저장하는 함수
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => { // 빈칸이 있는지 확인하는 함수
    const requiredFields = {
      id: '아이디',
      pw: '비밀번호',
      name: '이름',
      nickname: '닉네임',
      phone: '핸드폰 번호',
      zipcode1: '우편번호',
      zipcode2: '도로명 주소',
      address: '지번 주소',
      detailAddress: '상세 주소',
    };

    for (const key in requiredFields) {
      if (!formData[key].trim()) {
        alert(`${requiredFields[key]}이(가) 비어있습니다`);
        return false; // 하나라도 비어있으면 중단
      }
    }

    return true; // 모두 입력되었을 경우
  };

  const join = () => { // 회원가입 - 가입하기 버튼 클릭
    if (!validateForm()) return; // 빈칸이 없다면 아래 실행

    if (!isAuthSuccess) { // 인증을 했다면 아래 실행
      alert("이메일 인증을 완료해주세요!");
      return;
    }
    axios.post('http://localhost:8083/controller/join', formData)
      .then(res => {
        if (res.data == 1) {
          alert("가입이 완료되었습니다");
          setSignUp(false);
        }
      });
  }

  const sendEmail = () => { // 이메일 인증번호 발송
    if (!formData.email) {
      alert("이메일을 입력해주세요.");
      return;
    }

    // 인증번호 발송 중 표시
    setAuthStep("sending");

    axios.post("http://localhost:8083/controller/sendEmail", {
      email: formData.email
    })
      .then((res) => {
        alert("📬 이메일을 확인해주세요!\n스팸메일함도 꼭 확인해주세요!");
        setAuthStep("input"); // 입력창 열기
      })
      .catch((err) => {
        console.error("인증번호 전송 실패:", err);
        alert("⚠️ 인증번호 전송에 실패했습니다.\n다시 시도해주세요.");
        setAuthStep("none"); // 다시 숨기기
      });
  };

  const emailCheck = () => { // 인증 번호 확인
    if (!authCode) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    axios.post("http://localhost:8083/controller/verifyCode", {
      email: formData.email,
      code: authCode
    })
      .then((res) => {
        if (res.data === true) {
          alert("✅ 인증 성공!");
          setIsAuthSuccess(true); // 인증 성공 상태 저장
        } else {
          alert("❌ 인증번호가 일치하지 않습니다.");
        }
      })
      .catch((err) => {
        console.error("인증 확인 실패:", err);
        alert("⚠️ 인증 확인 중 오류가 발생했습니다.");
      });
  };

  const check = () => { // 중복 체크
    axios.post("http://localhost:8083/controller/check", {
      id: formData.id,
      nickname: formData.nickname
    })
      .then((res) => {
        if (res.data === 1) {
          alert("사용가능합니다.");
        } else {
          alert("중복되었습니다.");
        }

      })
  }

  return ( // 화면에 출력하는 곳
    <div>
      {signUp ? // 회원가입 
        (
          <div className="signUp-container">
            <div className="form-group">
              <input type="text" className="form-input" name="id" placeholder="아이디" onChange={handleChange} />
              <button className="button" onClick={check}>중복확인</button>
            </div>
            <div className="form-group password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                name="pw"
                placeholder="비밀번호"
                onChange={handleChange}
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}>
                👁️
              </span>
            </div>

            <div className="form-group password-wrap">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-input"
                name="confirmPassword"
                placeholder="비밀번호 확인"
                onChange={handleChange}
              />
              <span
                className="eye-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                👁️
              </span>
            </div>
            <div className="form-group">
              <input type="text" className="form-input-name" name="name" placeholder="이름" onChange={handleChange} />
            </div>
            <div className="form-group">
              <input type="text" className="form-input" name="nickname" placeholder="닉네임" onChange={handleChange} />
              <button className="button" onClick={check}>중복확인</button>
            </div>
            <div className="form-group">
              <input type="text" className="form-input-name" name="phone" placeholder="전화번호 -없이 작성해주세요" onChange={handleChange} />
            </div>
            <div className="form-group">
              <input className="form-input" name="email" placeholder="이메일" onChange={handleChange} />
              <button className="button" onClick={sendEmail}>인증요청</button>
            </div>
            <div className="form-group">
              {authStep === "sending" && (
                <span className="auth-loading-msg">📨 인증번호 발송 중입니다...</span>
              )}
              {authStep === "input" && !isAuthSuccess && (
                <>
                  <input
                    className="form-input"
                    name="authCode"
                    placeholder="인증 번호"
                    onChange={(e) => setAuthCode(e.target.value)}
                  />
                  <button className="button" onClick={emailCheck}>인증확인</button>
                </>
              )}
              {isAuthSuccess && (
                <span className="auth-success-msg">✅ 인증이 완료되었습니다.</span>
              )}
            </div>
            <div className="form-group">
              <input className="form-input-post"
                type="text"
                id="sample4_postcode"
                name="zipcode1"
                onChange={handleChange}
                placeholder="우편번호"
                ref={postcodeRef}
              />
              <input className="form-input-post"
                type="button"
                onClick={sample4_execDaumPostcode}
                value="우편번호 찾기"
              />
            </div>
            <div className="form-group">
              <input className="form-input"
                type="text"
                id="sample4_roadAddress"
                placeholder="도로명주소"
                name="zipcode2"
                onChange={handleChange}
                ref={roadAddressRef}
              />
            </div>
            <div className="form-group">
              <input className="form-input"
                type="text"
                id="sample4_jibunAddress"
                placeholder="지번주소"
                name="address"
                onChange={handleChange}
                ref={jibunAddressRef}
              />
            </div>
            <div className="form-group">
              <span className="form-input"
                id="guide"
                ref={guideRef}
                style={{ color: "#999", display: "none" }}
              ></span>
              <input className="form-input"
                type="text"
                id="sample4_detailAddress"
                placeholder="상세주소"
                name="detailAddress"
                onChange={handleChange}
                ref={detailAddressRef} />
            </div>
            <button className="submit-button" onClick={join}>가입하기</button>
          </div>

        ) : !isLoggedIn ? ( // 로그아웃 된 상태에서 실행
          <div className="login-container">
            <h2 className="login-title">로그인</h2>
            <div className="login-box">
              <input type="text" placeholder="아이디" className="login-input" onChange={(e) => setId(e.target.value)} value={id} />
              <input type="password" placeholder="비밀번호" className="login-input" onChange={(e) => setPw(e.target.value)} value={pw} />
              <button className="login-btn" onClick={handleLogin}>로그인</button>
              <div className="login-divider">
                <div className="sns-login-buttons">
                  <button className="sns-btn" id="google">
                    <img src={GoogleIcon} alt="구글 로그인" />
                  </button>
                  <button className="sns-btn" onClick={loginWithKakao}>
                    <img src={KakaoIcon} alt="카카오 로그인" />
                  </button>
                  <button className="sns-btn">
                    <img src={NaverIcon} alt="네이버 로그인" />
                  </button>
                </div>
              </div>
              <div className="login-links">
                <span>아이디 찾기</span>
                <span>•</span>
                <span>비밀번호 찾기</span>
              </div>
            </div>
            <div className="signup-box">계정이 없으신가요?
              <span className="signup-link" onClick={signupGo}>가입하기</span>
            </div>
          </div>
        ) : ( // 로그인 된 상태에서 실행
          <div className="login-success-box">
            <div className="welcome-message">
              <FaUserCircle size={32} className="user-icon" />
              <span><strong>{nickname}</strong>님, 환영합니다!</span>
            </div>
            <div className="button-group">
              <button className="mypage-btn" onClick={() => nav("/mypage")} >마이페이지</button>
              <button className="cart-btn" onClick={() => nav("/cartpage")}>
                <FaShoppingCart /> 장바구니
              </button>
              <button className="logout-btn" onClick={handleLogout} type="button">
                <FaSignOutAlt /> 로그아웃
              </button>
            </div>
          </div>
        )}

    </div>

  );// 리턴 종료
};

export default SidePage;
