window.loadArgon2WasmModule = () => import('/dist/argon2mod.js');
window.argon2WasmPath = '/dist/argon2.wasm';

const i18n = {
  "sitename": {
    ru: "Название сайта",
    en: "Website name"
  },
  "mainpassword": {
    ru: "Основной пароль",
    en: "Main password"
  },
  "length": {
    en: "Length",
    ru: "Длина"
  },
  "alphabet": {
    en: "Characters",
    ru: "Символы"
  }
}

const alphabet = {
     "4": "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:;<=>@[\\]^_`{|}~",
     "3": "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
     "2": "0123456789abcdefghijklmnopqrstuvwxyz",
     "1": "0123456789"
  };

const checkPassword = (pwd, charset) => {
  let types = [false, false, false, false];
  for (let i in pwd) {
    types[0] ||= Boolean(pwd[i].match(/[0-9]/));
    types[1] ||= Boolean(pwd[i].match(/[a-z]/));
    types[2] ||= Boolean(pwd[i].match(/[A-Z]/));
    types[3] ||= ":;<=>@[\\]^_`{|}~".includes(pwd[i]);
  }
  return types.slice(0, charset).every(Boolean);
};

const getParams = () => {
  let site = document.forms.f1.name.value.trim();
  let passwd = document.forms.f1.password.value.trim();
  let length = document.forms.f1.length.value.trim();
  let charset = document.forms.f1.alphabet.value.trim();

  const obj = { site, passwd, length, charset };

  obj.json = JSON.stringify(obj);

  return obj;
}

const genPasswd = (oldParams, params) => {
    argon2.hash({
      pass: params.passwd,
      salt: "hpwdsalt" + "$" + params.site + "$" + params.length + "$" + params.charset,
      time: 30,
      mem: 64,
      hashLen: params.length,
      type: argon2.ArgonType.Argon2id
    }).then(res => {
      let params2 = getParams();
      if (oldParams.json !== params2.json) return;

      let chars = alphabet[params.charset];
      let password = Array.from(res.hash).map(x => chars[x % chars.length]).join("");
        
      if (!checkPassword(password, params.charset)) {
        const newParams = params;
        newParams.passwd = password;
        genPasswd(oldParams, newParams);
        return;
      }

      document.forms["result"]["pwd-result"].value = password;
    }).catch(err => {
      console.error(err);
      document.forms["result"]["pwd-result"].value = "";
    });
}

const handle = () => {
  document.getElementById("copy").children[0].src = "/dist/copy.svg"

  let params = getParams();

  if (params.length < 4 || Object.entries(params).find(x => x[1] === "") != undefined) {
      document.forms["result"]["pwd-result"].value = "";
      return;
  }

  genPasswd(params, params);
}

const updateLanguage = () => {
  let lang = localStorage.getItem("language");
  if (!lang) lang = navigator.language.split("-")[0];
  document.querySelectorAll('[data-loc]').forEach(el => {
    el.innerText = i18n[el.attributes["data-loc"].value][lang];
    el.classList.remove("hidden");
  });
};

window.onload = () => {
  updateLanguage();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
  }
  Object.entries(document.forms.f1).forEach(fld => {
    fld[1].oninput = handle;
  });

  document.getElementById("reveal").onclick = () => {
    let images = [
      "/dist/hide.svg",
      "/dist/show.svg",
    ];

    let elem = document.getElementById("reveal").children[0];
    let url = new URL(elem.src);

    if (url.pathname === images[0]) {
      elem.src = images[1];
      document.getElementById("pwd-result").type = "text";
    } else {
      elem.src = images[0];
      document.getElementById("pwd-result").type = "password";
    }
  };

  document.getElementById("copy").onclick = () => {
    if (!document.getElementById("pwd-result").value) return;
    navigator.clipboard.writeText(document.getElementById("pwd-result").value);
    document.getElementById("copy").children[0].src = "/dist/done.svg"
  };

  document.getElementById("ru").onclick = () => {
    localStorage.setItem("language", "ru");
    updateLanguage();
  };

  document.getElementById("en").onclick = () => {
    localStorage.setItem("language", "en");
    updateLanguage();
  };

  // document.getElementById("tlbl").onclick = () => {
  //   let cl = document.body.classList;
  //   if (cl.contains("dark")) {
  //     cl.remove("dark");
  //   } else {
  //     cl.add("dark");
  //   }
  // };
}
