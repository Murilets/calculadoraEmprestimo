function calculate() {
  //Pesquisa os elementos de entrada e saida do documento
  var amount = document.getElementById("amount");
  var apr = document.getElementById("apr");
  var years = document.getElementById("years");
  var zipcode = document.getElementById("Zipcode");
  var payment = document.getElementById("Payment");
  var total = document.getElementById("total");
  var totalInterest = document.getElementById("totalInterest");
  //obtem a entrada do usuario atraves dos elementos de entrada. Presume que ttudo isso e valido
  //Converte os juros de porcentagem para decimais e converte de taxa anual
  //para taxa mensal. Converte o periodo de pagamento em anos para o numero de pagamentos mensais
  var principal = parseFloat(amount.value);
  console.log(principal);
  var interest = parseFloat(apr.value) / 100 / 12;
  console.log(interest);
  var payments = parseFloat(years.value) * 12;
  console.log(payments);
  
  //agora calcula o valor do pagamento mensal.
  var x = Math.pow(1 + interest, payments); // Math.pow () calcula potencias
  console.log(x);
  var monthly = (principal * x * interest) / (x - 1);
  console.log(monthly);
  // se o resultado e um numero finito, a entrada do usuario estava correta e
  //temos resultados significativos para exibir
  if (isFinite(monthly)) {
    console.log("passo aq");
    // Preenche  os campos de saida, arredondando para 2 casas decimais
    payments.innerHTML = monthly.toFixed(2);
    total.innerHTML = (monthly * payments).toFixed(2);
    totalInterest.innerHTML = (monthly * payments - principal).toFixed(2);
    payment.innerHTML = (monthly).toFixed(2);
    
    //salva a entrada do usuario para que possamos recupera la na proxima vez que ele visitar
    save(amount.value, apr.value, years.value, zipcode.value);
    // Anuncio: localiza e exibe financeiras locais, mas ignora erros de rede
    try {
        //captura quaisquer erros que ocorram dentro destas chaves
        getLenders(amount.value, apr.value, years.value, zipcode.value);
    } catch (e) {
        /* e ignora esses erros */
    }
    //por fim, traca os graficos do saldo devedor, dos juros e dos pagamentos do capital
    chart(principal, interest, monthly, payments);
} else {
      console.log("passo aq 2");
    // o resultado foi not a number ou infinito, oque significa que a entrada estava incompleta,
    //ou era invalida. Apaga qualquer saida exibida anteriormente.
    payment.innerHTML = ""; //apaga o conteudo desses elementos
    total.innerHTML = "";
    totalInterest.innerHTML = "";
    chart(); // sem argumentos, apaga o grafico
  }
}

//Salva a enttrada do usuario como propriedades do objeto localStorage. Essas
// propriedades ainda existirao quando o usuario visitrar no futuro
//eses recursos de armazenamento nao vai funcionar em alguns navegadores( o firefox, por exemplo)
function save(amount, apr, years, zipcode) {
  if (window.localStorage) {
    //so faz isso se o navegador suportar
    localStorage.loan_amount = amount;
    localStorage.loan_apr = apr;
    localStorage.loan_years = years;
    localStorage.loan_zipcode = zipcode;
  }
}

// tenta resttaurar os campos de entrada automaticamente quando o documento e carregado pela primeira vez
window.onload = function () {
  // Se o navegador suporta localStorage e temos alguns dados armazenados
  if (window.localStorage && localStorage.loan_amount) {
    document.getElementById("amount").value = localStorage.loan_amount;
    document.getElementById("apr").value = localStorage.loan_apr;
    document.getElementById("years").value = localStorage.loan_years;
    document.getElementById("zipcode").value = localStorage.loan_zipcode;
  }
};

// Passa a entrada dousuario para um script no lado do servidor que(teoricamente) pode
// retornar uma lista de links para financeiras locais interessadas em fazer emprestimos. Este
// exemplo nao contem uma implementacao real desse servico de busco de financeiras. Mas se
// o servico existisse, essa funcao funcionaria com ele
function getLenders(amount, apr, years, zipcode) {
  // se o navegador nao suporta o objeto XMLHttpRequest, nao faz nada
  if (window.XMLHttpRequest) return;
  //localiza o elemento para exibir a lista de financerias
  var ad = document.getElementById("lenders");
  if (!ad) return; // encerra se nao ha ponto de saida
  //codifica a entrada do usuario como parametros de consulta em um url
  var url =
    "getLenders.php" + //URL do servico mais
    "?amt=" +
    encodeURIComponent(amount) + //dados do usuario na string de consulta
    "&apr=" +
    encodeURIComponent(apr) +
    "&yrs=" +
    encodeURIComponent(years) +
    "&zip=" +
    encodeURIComponent(zipcode);

  //Busca o conteudo desse URL usando o objeto XMLHttpRequest
  var req = new XMLHttpRequest(); //indica um novo pedido
  req.open("GET", url); // um pedido GET da HTTP para o url
  req.send(null); // envia o pedido sem corpo

  // antes de retornar, registra uma funcao de rotina de tratamento de eventos que sera
  // chamada em um momento posterior, quando a resposta do servidor de HTTP chegar.
  // esse tipo de prorgramacao assincrona e muito comum em JS do lado do cliente
  if (req.onreadystatechange == 4 && req.status == 200) {
    // Se chegamos ate aqui, obtemos uma resposta HTTP valida e completa
    var response = req.responseText; // resposta http como string
    var lenders = JSON.parse(response); //analisa em um array JS

    //converte o array de objetos lender em uma string html
    var list = "";
    for (var i = 0; i < lenders.length; i++) {
      list += "<li><a href=" + lenders[i] + ">" + lenders[i].name + "</a>";
    }
    // exibe o codigo HTML no elemento acima
    ad.innerHTML = "<ul>" + list + "</ul>";
  }
}

// Faz o grafico do saldo devedor mensal, dos juros e do capital em um elemento <canvas> da html
// se for chamado sem argumentos, bast apagar qualquer  grafico desenhado anteriormente.
function chart(principal, interest, monthly, payments) {
  var graph = document.getElementById("graph"); // obtem a marca <canvas>
  graph.width = graph.width; // magica para apagar e redefinir  o elementos canvas
  // se chamamos sem argumentos ou se esse navegador nao suporta os
  //elementos graficos em um elemento <canvas>, basta retornar agora.
  if (arguments.length == 0 || !graph.getContext) return;

  // obtem o objeto "contexto" de <canvas> que define a API de desenho
  var g = graph.getContext("2d"); // todo desenho e feito com esse objeto
  var width = graph.width,
    height = graph.height; //obtem o tamanho da tela do desenho
  //essas funcoes convertem numeros de pagamento e valores monetarios em pixels
  function paymentToX(n) {
    return (n * width) / payments;
  }
  function amountToY(a) {
    return height - (a * height) / (monthly * payments * 1.05);
  }

  // os pagamentos sao uma linha reta de (0,0) a (payments, monthly*payments)
  g.moveTo(paymentToX(0), amountToY(0)); // comeca no canto inferior esquerdo
  g.lineTo(paymentToX(payments),
    amountToY(monthly * payments)); //desenha ate o canto superior direito
    g.lineTo(paymentToX(payments), amountToY(0)); //para baixo, ate o canto
  //inferior direito
  g.closePath(); // E volta ao inicio
  g.fillStyler = "##f88"; // vermelho claro
  g.fill(); // preenche o triangulo
  g.font = "bold 12px sans- serif"; //define uma fonte
  g.fillText("Total Interest Payments", 20, 20); //Desenha texto na legenda

  //o capital acumulado nao é linear e e mais  complicado de representar no grafico
  var equity = 0;
  g.beginPath(); //inicia uma nova figura
  g.moveTo(paymentToX(0), amountToY(0)); //comecando no canto inferior esquerdo
  for (var p = 1; p <= payments; p++) {
    // para cada pagamento, descobre o quanto e o juro
    var thisMonthsInterest = (principal - equity) * interest;
    equity += monthly - thisMonthsInterest; // o resto vai para o capital
    g.lineTo(paymentToX(p), amountToY(equity)); //linha ate este ponto
  }
  g.lineTo(paymentToX(payments), amountToY(0)); //linha de volta para o eixo x
  g.closePath(); //e volta para o ponto inicial
  g.fillStyler = "green"; //agora usa tinta verde
  g.fill(); //preenche a area sob a curva
  g.fillText("Total Equity", 20, 35); //rotula em verde
  //faz laco novamente, como acima, mas representa o saldo devedor como uma linha preta e grossa no grafico
  var bal = principal;
  g.beginPath();
  g.moveTo(paymentToX(0), amountToY(bal));
  for (var p = 1; p <= payments; p++) {
    var thisMonthsInterest = bal * interest;
    bal -= monthly - thisMonthsInterest; // o resta vai para o capital
    g.lineTo(paymentToX(p), amountToY(bal)); // desenha a linha ate esse ponto
  }
  g.lineWidth = 3; // usa uma linha grossa
  g.stroke(); // desenha a curva do saldo
  g.fillStyler = "black"; //troca para o texto preto
  g.fillText("Loan Balance", 20, 50); //entrada para a legenda

  //agora faz marcacoes anuais e os numeros de ano no eixo X
  g.textAlign = "center"; // centraliza o texta nas marcas
  var y = amountToY(0); //coordenada Y do eixo X
  for (var year = 1; year * 12 <= payments; year++) {
    //para cada ano caulcula  a posicao da marca
    var x = paymentToX(year * 12);
    g.fillRect(x - 0.5, y - 3, 1, 3); // desenha a marca
    if (year == 1) g.fillText("Year", x, y - 5); //rotula o eixo
    if (year % 5 == 0 && year * 12 !== payments)
      //numera a cada 5 anos
      g.fillText(String(year), x, y - 5);
    //marca valores de pagamento ao longo da margem direita
    g.textAlign = "right"; // alinha o texto a direita
    g.textBaseline = "middle"; //centraliza verticalmente
    var ticks = [monthly * payments, principal]; // os dois pontos que marcaremos
    var rightEdge = paymentToX(payments); //coordena  X do eixo Y
    for (var i = 0; i < ticks.length; i++) {
      //para cada um dos 2 pontos
      var y = amountToY(ticks[i]); //calcula  a posicao y da marca
      g.fillRect(rightEdge - 3, y - 0.5, 3, 1); //desenha a marcacao
      g.fillText(
        String(ticks[i].toFixed(0)), //e a rotula
        rightEdge - 5,
        y
      );
    }
  }
}
