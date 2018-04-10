function FixAlgo(algo) {
    if (algo == "phi1612") algo = "phi";
    else if ((algo == "myr-gr")) algo = algo;
    else {
      let tempAlgo = algo.split("-");
      if (tempAlgo.length == 2) algo = tempAlgo[0];
    }
    return algo;
  }

  function FixCURR(CURR) {
    //ПЕРЕВЕСТИ все в аперкейс
    CURR = CURR.toUpperCase();
    //Удалить пробелы
    CURR = CURR.replace(/[\s\-]/g, "");
    CURR = CURR.replace(/COIN/gi, "");
    return CURR;
  }

  module.exports.FixAlgo = FixAlgo;
  module.exports.FixCURR = FixCURR;
