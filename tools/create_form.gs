/**
 * 課題解決ハッカソン お問い合わせフォームを生成する Google Apps Script。
 *
 * 使い方:
 *   1. https://script.google.com/ で「新しいプロジェクト」を作成
 *   2. このファイルの中身を全部貼り付けて保存
 *   3. 関数 createForm を選んで「実行」→ 初回は承認ダイアログで許可
 *   4. 「実行ログ」に公開URL・編集URL・回答スプレッドシートのURLが出力される
 */
function createForm() {
  var form = FormApp.create('課題解決ハッカソン お問い合わせ');

  form.setDescription(
    '「うちの課題でもできる？」「どれくらい手間がかかる？」——検討の前の段階で構いません。\n' +
    '担当者より折り返しご連絡し、ハッカソンの進め方や課題の切り出し方をご説明します。\n\n' +
    '企画・運営：タケムラテックラボ'
  );

  // --- 基本情報 ---
  form.addTextItem()
      .setTitle('会社・団体・自治体名')
      .setRequired(true);

  form.addTextItem()
      .setTitle('ご担当者名')
      .setRequired(true);

  form.addTextItem()
      .setTitle('部署・役職')
      .setHelpText('任意');

  form.addTextItem()
      .setTitle('メールアドレス')
      .setRequired(true);

  form.addTextItem()
      .setTitle('電話番号')
      .setHelpText('任意。お急ぎの場合はご記入ください');

  // --- 検討状況 ---
  form.addMultipleChoiceItem()
      .setTitle('ご検討の段階')
      .setChoiceValues([
        'まずは話を聞いてみたい',
        '開催を前向きに検討している',
        '時期も含めて具体的に相談したい'
      ])
      .setRequired(true);

  form.addParagraphTextItem()
      .setTitle('解決したい課題')
      .setHelpText(
        'まだ言葉になっていなくて構いません。「こんなことで困っている」というレベルでご記入ください。' +
        '一緒に3時間で取り組めるお題に整理します。'
      );

  form.addMultipleChoiceItem()
      .setTitle('開催を考えている時期')
      .setChoiceValues(['3ヶ月以内', '半年以内', '1年以内', '未定・相談したい']);

  form.addMultipleChoiceItem()
      .setTitle('会場のご用意')
      .setChoiceValues([
        '自社・自組織の会場を用意できる',
        '用意が難しいので相談したい',
        '未定'
      ]);

  form.addParagraphTextItem()
      .setTitle('その他ご質問・ご要望');

  // --- 動作設定 ---
  form.setCollectEmail(false);        // 項目で聞くのでGoogleアカウント不要にする
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setProgressBar(false);
  form.setConfirmationMessage(
    'お問い合わせありがとうございます。\n' +
    '内容を確認のうえ、担当者より折り返しご連絡いたします。'
  );

  // Workspace アカウントだとログイン必須がデフォルトになることがあるため明示的に解除
  try {
    form.setRequireLogin(false);
  } catch (e) {
    Logger.log('setRequireLogin はこのアカウントでは適用不要/不可: ' + e.message);
  }

  // --- 回答をスプレッドシートに集約 ---
  var ss = SpreadsheetApp.create('課題解決ハッカソン お問い合わせ 回答');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log('--------------------------------------------------');
  Logger.log('公開URL（サイトに貼るのはこれ）: ' + form.getPublishedUrl());
  Logger.log('短縮URL                        : ' + form.shortenFormUrl(form.getPublishedUrl()));
  Logger.log('編集URL                        : ' + form.getEditUrl());
  Logger.log('回答スプレッドシート            : ' + ss.getUrl());
  Logger.log('--------------------------------------------------');
  Logger.log('※ 新着通知は、フォーム編集画面の「回答」タブ右上の ⋮ →');
  Logger.log('   「新しい回答についてメール通知を受け取る」をオンにしてください（APIからは設定できません）');
}
