const User = require('../models/UserModel');
const { validarRegisto } = require('../utils/userValidator');

/**
 * Exibe o formulário de login.
 */
const exibirLogin = (req, res) => {
  res.render("loginRegisto/login", {
    errorMessage: null,
  });
};

/**
 * Exibe o formulário de registo.
 */
const exibirRegisto = (req, res) => {
  res.render("loginRegisto/registar", {
    errorMessage: null,
    siteKey: process.env.CAPTCHA_API_KEY, 
  });
};

/**
 * Processa o registo de um novo utilizador (Create).
 */
const registar = async (req, res) => {
  const { nome, email, password, phoneNumber, age } = req.body;

  const recaptchaResponse = req.body["g-recaptcha-response"];
  const siteKey = process.env.CAPTCHA_API_KEY;

  if (!recaptchaResponse) {
    return res.render("loginRegisto/registar", {
      errorMessage: "Erro de segurança: Token não encontrado.",
      siteKey: siteKey,
    });
  }

  const secretKey = process.env.CAPTCHA_API_SECRET;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

  try {
    const googleResponse = await fetch(verifyUrl, { method: "POST" });
    const googleData = await googleResponse.json();

    const minScore = parseFloat(process.env.CAPTCHA_MIN_SCORE);

    if (!googleData.success || googleData.score < minScore) {
      return res.render("loginRegisto/registar", {
        errorMessage:
          "Registo bloqueado por suspeita de atividade automatizada (Bot).",
        siteKey: siteKey,
      });
    }
  } catch (error) {
    console.error("Erro ao validar reCAPTCHA:", error);
    return res.render("loginRegisto/registar", {
      errorMessage: "Erro de comunicação com o servidor de segurança.",
      siteKey: siteKey,
    });
  }

  const erroValidacao = validarRegisto(nome, email, password);
  if (erroValidacao) {
    return res.render("loginRegisto/registar", {
      errorMessage: erroValidacao,
      siteKey: siteKey,
    });
  }

  try {
    const userExistente = await User.findOne({ email });
    if (userExistente) {
      return res.render("loginRegisto/registar", {
        errorMessage: "Este email já está registado.",
        siteKey: siteKey, 
      });
    }

    const novoUser = new User({ nome, email, password, phoneNumber, age });
    await novoUser.save();

    res.redirect("/auth/login");
  } catch (err) {
    console.error("Erro no registo:", err);
    res.render("loginRegisto/registar", {
      errorMessage: "Ocorreu um erro inesperado.",
      siteKey: siteKey,
    });
  }
};

/**
 * Processa a autenticação do utilizador (FindOne).
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("loginRegisto/login", {
        errorMessage: "Credenciais inválidas.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render("loginRegisto/login", {
        errorMessage: "Credenciais inválidas.",
      });
    }

    res.send("Login efetuado com sucesso! Bem-vindo " + user.nome);
  } catch (err) {
    console.error("Erro no login:", err);
    res.render("loginRegisto/login", {
      errorMessage: "Erro ao processar o pedido.",
    });
  }
};

/**
 * Exibe a página de recuperação de password.
 */
const exibirRecuperarPassword = (req, res) => {
  res.render("loginRegisto/recuperarPassword");
};

module.exports = {
  exibirLogin,
  exibirRegisto,
  registar,
  login,
  exibirRecuperarPassword,
};
