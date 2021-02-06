// IFとか二項演算子とかもっとやりやすくしないと意味がない
// となると、正規表現でパースはしないほうが良かった

// 一応仕様を書いておく
/*
  コメントは1行単位
  let 変数 = ... から次のletまたはreturnまでが右辺
  returnは右辺が1行のみ
*/

function matched_function(line) {
  const matched = line.match(/^\s*function\s+(\w+)\s*\(([^)]*)\)/i);
  if(matched !== null) {
    return {
      name: matched[1],
      args: matched[2].split(',').map(s => s.trim()).filter(x => x !== '')
    };
  }  
  return undefined;
}

function matched_let(line) {
  const matched = line.match(/^\s*let\s+(\w+)\s*=\s*(.*)$/i);
  if(matched !== null) {
    return {
      name: matched[1],
      expr: matched[2]
    }
  }
  return;
}

function matched_return(line) {
  const matched = line.match(/^\s*return\s*(.*)$/i);
  if(matched !== null) {
    return {
      expr: matched[1]
    }
  }
  return;
}

function string_times(str, times) {
  let s = '';
  for(let i=0; i<times; i++) {
    s += str;
  }
  
  return s;
}

function is_comment(str) {
  return str.match(/^\s*\/\//) !== null;
}

function conv(s) {
  //行単位分割で正規表現でパース
  const lines = s.split(/[\r\n]+/);
  
  let buf = '';
  let func_buf = '';
  let let_buf = '';
  let let_count = 0;
  
  const finalizeFunc = () => {
    if(let_buf !== '') throw new Error('parse error');
      
    if(func_buf !== '') {
      buf += func_buf + ')\n\n';
      func_buf = '';
    }
  };
  
  lines.forEach(line => {
    if(is_comment(line)) return;
    
    const func_info = matched_function(line);
    if(func_info !== undefined) {
      finalizeFunc();
      
      buf += "// " + func_info.name + "\n";
      buf += "=" + (func_info.args.length > 0 ? "LAMBDA(" + func_info.args.join(', ') + ", " : "(");
      
      return;
    }
    
    const let_info = matched_let(line);
    if(let_info !== undefined) {
      if(let_buf !== '') {
        func_buf += let_buf + ", ";
        let_buf = '';
      }
      
      let_buf += "LET(" + let_info.name + ", " + let_info.expr;
      let_count ++;
      
      return;
    }
    
    const return_info = matched_return(line);
    if(return_info !== undefined) {
      if(let_buf !== '') {
        func_buf += let_buf + ", ";
        let_buf = '';
      }
      
      func_buf += return_info.expr;
      func_buf += string_times(')', let_count);
      // console.log(let_count);
      let_count = 0;
      
      return;
    }
    
    line = line.trim();
    
    if(let_buf !== '') {
      let_buf += line;
      return;
    }
    
    func_buf += line;
  });
  
  finalizeFunc();
  
  return buf;
}

const args = process.argv.slice(2);
if(args.length === 0) throw new Error("No files");

const s = require('fs').readFileSync(args[0], { encoding: 'utf-8' });

console.log(conv(s));
