// ===============================================
// REGRAS PARA REUNIR PESSOA COM ANIMAIS
// ===============================================
//
// 1) O animal vai para a pessoa que mostrar todos
//    os seus brinquedos favoritos NA ORDEM desejada.
//    → Ex: favoritos: [RATO, BOLA]
//         pessoa: [LASER, RATO, CAIXA, BOLA] ✅
//
// 2) A pessoa pode intercalar brinquedos que o animal
//    não queira, desde que a ordem seja mantida.
//    → É uma subsequência, não precisa ser sequência direta.
//
// 3) Gatos não dividem seus brinquedos.
//    → Interpretação prática que eu escolhi: cada pessoa só pode adotar 1 gato.
//      (Isso evita a “divisão” entre vários gatos.)
//
// 4) Se AMBAS as pessoas tiverem condições de adoção,
//    o animal não vai para ninguém → fica no abrigo.
//    → Empate → abrigo.
//
// 5) Cada pessoa pode adotar no máximo 3 animais.
//    → Se já tem 3, não pode adotar mais.
//
// 6) Regra especial para o LOCO (jabuti):
//    - Ele não se importa com a ordem dos brinquedos favoritos,
//      basta que todos estejam presentes (checagem por inclusão).
//    - Só pode ser adotado se a pessoa já tiver outro animal
//      de companhia (não pode ser o primeiro).
//
// ===============================================

class AbrigoAnimais {
  constructor() {
    // Eu deixei esse cadastro centralizado aqui para ficar fácil de bater com o enunciado.
    this.animais = {
      Rex: { tipo: 'cão', fav: ['RATO', 'BOLA'] },
      Mimi: { tipo: 'gato', fav: ['BOLA', 'LASER'] },
      Fofo: { tipo: 'gato', fav: ['BOLA', 'RATO', 'LASER'] },
      Zero: { tipo: 'gato', fav: ['RATO', 'BOLA'] },
      Bola: { tipo: 'cão', fav: ['CAIXA', 'NOVELO'] },
      Bebe: { tipo: 'cão', fav: ['LASER', 'RATO', 'BOLA'] },
      Loco: { tipo: 'jabuti', fav: ['SKATE', 'RATO'] },
    };

    // Conjunto de brinquedos válidos — eu uso pra validar entradas e evitar duplicados.
    this.brinqValidos = new Set(['RATO', 'BOLA', 'LASER', 'CAIXA', 'NOVELO', 'SKATE']);
  }

  // util: "A,B,C" -> ["A","B","C"]
  // Eu mantenho simples: separo por vírgula, tiro espaços e removo vazios.
  parseListaCSV(str) {
    if (typeof str !== 'string') return null; // se vier algo que não é string, eu já considero inválido
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Valido brinquedos: todos precisam existir e não pode ter duplicado.
  // Eu retorno { ok:true, arr } ou { ok:false } para ficar fácil de usar.
  validaBrinquedos(listaStr) {
    const arr = this.parseListaCSV(listaStr);
    if (!arr) return { ok: false };
    const seen = new Set();
    for (const b of arr) {
      if (!this.brinqValidos.has(b)) return { ok: false }; // brinquedo desconhecido
      if (seen.has(b)) return { ok: false };               // duplicado
      seen.add(b);
    }
    return { ok: true, arr };
  }

  // Valido animais: precisam existir no cadastro e não podem aparecer duplicados na ordem.
  validaAnimaisOrdem(ordemStr) {
    const arr = this.parseListaCSV(ordemStr);
    if (!arr) return { ok: false };
    const nomesValidos = new Set(Object.keys(this.animais));
    const seen = new Set();
    for (const a of arr) {
      if (!nomesValidos.has(a)) return { ok: false }; // animal que não existe
      if (seen.has(a)) return { ok: false };          // duplicado na ordem
      seen.add(a);
    }
    return { ok: true, arr };
  }

  // Checo subsequência (permite intercalar).
  // Eu gosto desse padrão porque ele é fácil de ler: avanço um ponteiro em 'seq' sempre que bate.
  isSubsequence(seq, lista) {
    let i = 0;
    for (const item of lista) {
      if (item === seq[i]) i++;
    }
    return i === seq.length;
  }

  // Para o Loco: eu só preciso garantir que TODOS os favoritos estão presentes (ordem não importa).
  containsAll(req, lista) {
    const set = new Set(lista);
    return req.every(x => set.has(x));
  }

  encontraPessoas(pessoa1Brinq, pessoa2Brinq, ordemAnimais) {
    // 1) Validações de entrada (eu sempre curto falhar cedo para simplificar o fluxo)
    const v1 = this.validaBrinquedos(pessoa1Brinq);
    const v2 = this.validaBrinquedos(pessoa2Brinq);
    if (!v1.ok || !v2.ok) return { erro: 'Brinquedo inválido' };

    const vOrd = this.validaAnimaisOrdem(ordemAnimais);
    if (!vOrd.ok) return { erro: 'Animal inválido' };

    const lista1 = v1.arr;
    const lista2 = v2.arr;
    const ordem = vOrd.arr; // eu decido os animais exatamente nessa ordem

    // 2) Estado de adoção ao longo do processamento
    const adotadosPor = {}; // animal -> 'pessoa 1' | 'pessoa 2' | 'abrigo'
    const count = { 'pessoa 1': 0, 'pessoa 2': 0 };          // controle do limite 3
    const gatosPorPessoa = { 'pessoa 1': 0, 'pessoa 2': 0 }; // “gatos não dividem” => máx 1 por pessoa

    // Regrinhas de capacidade por pessoa — eu separo num helper para ficar mais legível.
    const podeReceber = (pessoa, animalNome) => {
      // limite de 3
      if (count[pessoa] >= 3) return false;

      // gatos não dividem (minha interpretação: 1 gato por pessoa)
      const tipo = this.animais[animalNome].tipo;
      if (tipo === 'gato' && gatosPorPessoa[pessoa] >= 1) return false;

      return true;
    };

    // 3) Processamento animal a animal na ordem pedida
    for (const nome of ordem) {
      const { fav, tipo } = this.animais[nome];

      // Quem atende os favoritos?
      // Obs.: para o Loco eu ignoro ordem (containsAll); para os demais é subsequência.
      const p1ok = nome === 'Loco'
        ? this.containsAll(fav, lista1)
        : this.isSubsequence(fav, lista1);

      const p2ok = nome === 'Loco'
        ? this.containsAll(fav, lista2)
        : this.isSubsequence(fav, lista2);

      // Candidatos iniciais (já considerando limite de 3 e restrição de gatos)
      let candidatos = [];
      if (p1ok && podeReceber('pessoa 1', nome)) candidatos.push('pessoa 1');
      if (p2ok && podeReceber('pessoa 2', nome)) candidatos.push('pessoa 2');

      // Regrinha do Loco: só vai para quem JÁ tem companhia (ou seja, pelo menos 1 animal antes)
      if (nome === 'Loco') {
        candidatos = candidatos.filter(p => count[p] >= 1);
      }

      // Se não sobrar exatamente 1 candidato → vai para o abrigo (empate ou ninguém atende)
      if (candidatos.length !== 1) {
        adotadosPor[nome] = 'abrigo';
        continue;
      }

      // Adoção realizada
      const escolhido = candidatos[0];
      adotadosPor[nome] = escolhido;
      count[escolhido]++;

      // Se for gato, eu atualizo o controle para respeitar “não dividir”
      if (tipo === 'gato') {
        gatosPorPessoa[escolhido]++;
      }
    }

    // 4) Saída
    // Aqui eu **corrigi**: a lista final deve conter **apenas** os animais recebidos em 'ordemAnimais',
    // e não todos do cadastro. E precisa estar **em ordem alfabética** pelo nome.
    // (Eu deixei esse comentário para eu mesma lembrar do motivo do teste ter falhado antes 😅)
    const unicosDaOrdem = Array.from(new Set(ordem)); // já validamos duplicados, mas eu mantenho por segurança
    const lista = unicosDaOrdem
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map(nome => `${nome} - ${adotadosPor[nome] ?? 'abrigo'}`);

    return { lista };
  }
}

export { AbrigoAnimais as AbrigoAnimais };
