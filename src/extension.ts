import * as vscode from 'vscode';

/**
 * Interface Bookmark que define a estrutura de um bookmark.
 */
interface Bookmark {
    uri: string;               // URI do documento onde o bookmark está localizado
    position: vscode.Position; // Posição da linha do bookmark no documento
}

// Armazenamento de todos os bookmarks, usando um objeto onde a chave é o número do bookmark
const bookmarks: { [key: number]: Bookmark } = {};

// Tipo de decoração para os bookmarks
let decorationType: vscode.TextEditorDecorationType;

// Tipo de decoração para exibir os números dos bookmarks
let numberDecorationType: vscode.TextEditorDecorationType;

/**
 * Função que ativa a extensão e inicializa as decorações e comandos.
 * @param context - O contexto da extensão, permitindo registrar comandos e eventos.
 */
export function activate(context: vscode.ExtensionContext) {
    // Criação do tipo de decoração para o bookmark (pintura de linha)
    decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 204, 203, 0.5)', // Cor de fundo da linha
        border: '1px solid rgba(178, 34, 34, 1)',    // Bordas da linha
        overviewRulerColor: 'blue',                  // Cor da régua de visão geral
        overviewRulerLane: vscode.OverviewRulerLane.Left, // Localização na régua
    });

    // Criação do tipo de decoração para exibir o número do bookmark
    numberDecorationType = vscode.window.createTextEditorDecorationType({
        after: {
            contentText: '', // Texto que será adicionado após a linha
            color: 'rgba(178, 34, 34, 1)', // Cor do número
            fontWeight: 'bold', // Peso da fonte para o número
            margin: '0 0 0 5px', // Margem para afastar o número do texto
        },
    });

    // Comandos para adicionar/remover bookmarks, de 1 a 9
    for (let i = 1; i <= 9; i++) {
        context.subscriptions.push(
            vscode.commands.registerCommand(`extension.toggleBookmark${i}`, () => toggleBookmark(i)),
            vscode.commands.registerCommand(`extension.goToBookmark${i}`, () => goToBookmark(i))
        );
    }

    // Atualiza o editor quando o arquivo mudar
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(() => {
            updateDecorations(vscode.window.activeTextEditor);
        }),
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateDecorations(editor);
            }
        })
    );

    // Inicializa as decorações quando a extensão é ativada pela primeira vez
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        updateDecorations(editor);
    }

    // Atualiza as decorações de todos os editores abertos na ativação da extensão
    vscode.window.onDidChangeVisibleTextEditors(editors => {
        editors.forEach(editor => {
            updateDecorations(editor);
        });
    });
}

/**
 * Alterna o estado de um bookmark para a linha atual.
 * @param index - O índice do bookmark a ser alternado (1 a 9).
 */
function toggleBookmark(index: number) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const position = editor.selection.active; // Posição atual do cursor
        const currentUri = editor.document.uri.toString();

        // Verifica se já existe um bookmark para o índice especificado
        const existingBookmark = bookmarks[index];

        if (existingBookmark) {
            // Se o bookmark já existe, verifica se é do mesmo arquivo e se a posição é igual
            if (existingBookmark.uri === currentUri && existingBookmark.position.line === position.line) {
                // Remove o bookmark se a posição for a mesma
                delete bookmarks[index];
            } else {
                // Atualiza a posição do bookmark se a linha atual for diferente
                bookmarks[index] = { uri: currentUri, position: position }; // Atualiza ou cria novo bookmark
            }
        } else {
            // Se não existe, adiciona um novo bookmark
            bookmarks[index] = { uri: currentUri, position: position }; // Adiciona novo bookmark
        }

        // Atualiza as decorações independentemente do resultado
        updateDecorations(editor); 
    }
}

/**
 * Navega para o bookmark especificado.
 * @param index - O índice do bookmark a ser visitado (1 a 9).
 */
function goToBookmark(index: number) {
    const bookmark = bookmarks[index];
    if (bookmark) {
        const uri = vscode.Uri.parse(bookmark.uri);
        const position = bookmark.position;
        vscode.window.showTextDocument(uri).then(editor => {
            editor.selection = new vscode.Selection(position, position); // Seleciona a linha
            editor.revealRange(new vscode.Range(position, position)); // Revela a linha
        });
    } else {
        vscode.window.showInformationMessage(`Bookmark ${index} não encontrado.`);
    }
}

/**
 * Atualiza as decorações no editor para refletir os bookmarks existentes.
 * @param editor - O editor de texto onde as decorações devem ser atualizadas.
 */
function updateDecorations(editor: vscode.TextEditor | undefined) {
    if (!editor) return; // Retorna se não houver editor ativo

    const ranges: vscode.DecorationOptions[] = []; // Para as linhas com bookmarks
    const numberRanges: vscode.DecorationOptions[] = []; // Para os números dos bookmarks

    for (const key in bookmarks) {
        const bookmark = bookmarks[key];
        if (bookmark.uri === editor.document.uri.toString()) {
            const range = new vscode.Range(bookmark.position.line, 0, bookmark.position.line + 1, 0); // Intervalo da linha
            ranges.push({ range: range, hoverMessage: `Bookmark ${key}` }); // Adiciona linha com hover

            numberRanges.push({
                range: new vscode.Range(bookmark.position.line, 0, bookmark.position.line, 0), // Número no início da linha
                renderOptions: {
                    after: {
                        contentText: `[${key}]`, // Texto do número do bookmark
                        color: 'rgba(178, 34, 34, 1)', // Cor do número
                        fontWeight: 'bold',
                    },
                },
            });
        }
    }

    // Aplica as decorações
    editor.setDecorations(decorationType, ranges);
    editor.setDecorations(numberDecorationType, numberRanges);
}

/**
 * Limpa as decorações no editor quando um arquivo é alterado.
 * @param editor - O editor de texto onde as decorações devem ser limpas.
 */
function clearDecorations(editor: vscode.TextEditor) {
    editor.setDecorations(decorationType, []);
    editor.setDecorations(numberDecorationType, []);
}

/**
 * Função chamada quando a extensão é desativada.
 * Pode ser usada para limpar dados, se necessário.
 */
export function deactivate() {
    // Limpar bookmarks ao desativar a extensão, se necessário
}






// import * as vscode from 'vscode';

// /**
//  * Interface Bookmark que define a estrutura de um bookmark.
//  */
// interface Bookmark {
//     uri: string;               // URI do documento onde o bookmark está localizado
//     position: vscode.Position; // Posição da linha do bookmark no documento
// }

// // Armazenamento de todos os bookmarks, usando um objeto onde a chave é o número do bookmark
// const bookmarks: { [key: number]: Bookmark } = {};

// // Tipo de decoração para os bookmarks
// let decorationType: vscode.TextEditorDecorationType;

// // Tipo de decoração para exibir os números dos bookmarks
// let numberDecorationType: vscode.TextEditorDecorationType;

// /**
//  * Função que ativa a extensão e inicializa as decorações e comandos.
//  * @param context - O contexto da extensão, permitindo registrar comandos e eventos.
//  */
// export function activate(context: vscode.ExtensionContext) {
//     // Criação do tipo de decoração para o bookmark (pintura de linha)
//     decorationType = vscode.window.createTextEditorDecorationType({
//         backgroundColor: 'rgba(255, 204, 203, 0.5)', // Cor de fundo da linha
//         border: '1px solid rgba(178, 34, 34, 1)',    // Bordas da linha
//         overviewRulerColor: 'blue',                  // Cor da régua de visão geral
//         overviewRulerLane: vscode.OverviewRulerLane.Left, // Localização na régua
//     });

//     // Criação do tipo de decoração para exibir o número do bookmark
//     numberDecorationType = vscode.window.createTextEditorDecorationType({
//         after: {
//             contentText: '', // Texto que será adicionado após a linha
//             color: 'rgba(178, 34, 34, 1)', // Cor do número
//             fontWeight: 'bold', // Peso da fonte para o número
//             margin: '0 0 0 5px', // Margem para afastar o número do texto
//         },
//     });

//     // Comandos para adicionar/remover bookmarks, de 1 a 9
//     for (let i = 1; i <= 9; i++) {
//         context.subscriptions.push(
//             vscode.commands.registerCommand(`extension.toggleBookmark${i}`, () => toggleBookmark(i)),
//             vscode.commands.registerCommand(`extension.goToBookmark${i}`, () => goToBookmark(i))
//         );
//     }

//     // Atualiza o editor quando o arquivo mudar
//     context.subscriptions.push(
//         vscode.workspace.onDidChangeTextDocument(() => {
//             updateDecorations(vscode.window.activeTextEditor);
//         }),
//         vscode.window.onDidChangeActiveTextEditor(editor => {
//             if (editor) {
//                 updateDecorations(editor);
//             }
//         })
//     );

//     // Inicializa as decorações quando a extensão é ativada pela primeira vez
//     const editor = vscode.window.activeTextEditor;
//     if (editor) {
//         updateDecorations(editor);
//     }

//     // Atualiza as decorações de todos os editores abertos na ativação da extensão
//     vscode.window.onDidChangeVisibleTextEditors(editors => {
//         editors.forEach(editor => {
//             updateDecorations(editor);
//         });
//     });
// }

// /**
//  * Alterna o estado de um bookmark para a linha atual.
//  * @param index - O índice do bookmark a ser alternado (1 a 9).
//  */
// function toggleBookmark(index: number) {
//     const editor = vscode.window.activeTextEditor;
//     if (editor) {
//         const position = editor.selection.active; // Posição atual do cursor
//         const key = index; // Índice do bookmark

//         // Verifica se já existe um bookmark
//         if (bookmarks[key] && bookmarks[key].uri === editor.document.uri.toString()) {
//             delete bookmarks[key]; // Remove o bookmark
//             clearDecorations(editor); // Atualiza a visualização
//         } else {
//             bookmarks[key] = { uri: editor.document.uri.toString(), position: position }; // Adiciona novo bookmark
//             updateDecorations(editor); // Atualiza decorações
//         }
//     }
// }

// /**
//  * Navega para o bookmark especificado.
//  * @param index - O índice do bookmark a ser visitado (1 a 9).
//  */
// function goToBookmark(index: number) {
//     const bookmark = bookmarks[index];
//     if (bookmark) {
//         const uri = vscode.Uri.parse(bookmark.uri);
//         const position = bookmark.position;
//         vscode.window.showTextDocument(uri).then(editor => {
//             editor.selection = new vscode.Selection(position, position); // Seleciona a linha
//             editor.revealRange(new vscode.Range(position, position)); // Revela a linha
//         });
//     } else {
//         vscode.window.showInformationMessage(`Bookmark ${index} não encontrado.`);
//     }
// }

// /**
//  * Atualiza as decorações no editor para refletir os bookmarks existentes.
//  * @param editor - O editor de texto onde as decorações devem ser atualizadas.
//  */
// function updateDecorations(editor: vscode.TextEditor | undefined) {
//     if (!editor) return; // Retorna se não houver editor ativo

//     const ranges: vscode.DecorationOptions[] = []; // Para as linhas com bookmarks
//     const numberRanges: vscode.DecorationOptions[] = []; // Para os números dos bookmarks

//     for (const key in bookmarks) {
//         const bookmark = bookmarks[key];
//         if (bookmark.uri === editor.document.uri.toString()) {
//             const range = new vscode.Range(bookmark.position.line, 0, bookmark.position.line + 1, 0); // Intervalo da linha
//             ranges.push({ range: range, hoverMessage: `Bookmark ${key}` }); // Adiciona linha com hover

//             numberRanges.push({
//                 range: new vscode.Range(bookmark.position.line, 0, bookmark.position.line, 0), // Número no início da linha
//                 renderOptions: {
//                     after: {
//                         contentText: `[${key}]`, // Texto do número do bookmark
//                         color: 'rgba(178, 34, 34, 1)', // Cor do número
//                         fontWeight: 'bold',
//                     },
//                 },
//             });
//         }
//     }

//     // Aplica as decorações
//     editor.setDecorations(decorationType, ranges);
//     editor.setDecorations(numberDecorationType, numberRanges);
// }

// /**
//  * Limpa as decorações no editor quando um arquivo é alterado.
//  * @param editor - O editor de texto onde as decorações devem ser limpas.
//  */
// function clearDecorations(editor: vscode.TextEditor) {
//     editor.setDecorations(decorationType, []);
//     editor.setDecorations(numberDecorationType, []);
// }

// /**
//  * Função chamada quando a extensão é desativada.
//  * Pode ser usada para limpar dados, se necessário.
//  */
// export function deactivate() {
//     // Limpar bookmarks ao desativar a extensão, se necessário
// }
