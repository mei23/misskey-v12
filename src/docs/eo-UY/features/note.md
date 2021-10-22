# Notoj
Notoj estas centraj konceptoj en Misskey kaj enhavoj kiuj konsistas el teksto, bildoj, dosieroj, balotujo k.t.p.Ankaŭ krei notojn estas nomata "noto" same kiel ili

ノートが作成されると、[タイムライン](./timeline)に追加され、自分の[フォロワー](./follow)やサーバーのユーザーが見れるようになります。

ノートには、[リアクション](./reaction)を行うことができます。また、返信や引用もできます。

ノートを[お気に入り](./favorite)登録することで、後で簡単に見返すことができます。

## Skribi notojn
ノートを作成するには、画面上にある鉛筆マークのボタンを押して、作成フォームを開きます。作成フォームに内容を入力し、「ノート」ボタンを押すことでノートが作成されます。 ノートには、画像、動画など任意のファイルや、[アンケート](./poll)を添付することができます。また、本文中には[MFM](./mfm)が使用でき、[メンション](./mention)や[ハッシュタグ](./hashtag)を含めることもできます。 他にも、CWや公開範囲といった設定も行えます(詳細は後述)。
<div class="info">ℹ️ コンピューターのクリップボードに画像データがある状態で、フォーム内のテキストボックスにペーストするとその画像を添付することができます。</div>
<div class="info">ℹ️ テキストボックス内で<kbd class="key">Ctrl + Enter</kbd>を押すことでも投稿できます。</div>

## Plusendi noton
既にあるノートを引用、もしくはそのノートを新しいノートとして共有する行為、またそれによって作成されたノートをRenoteと呼びます。 自分がフォローしているユーザーの、気に入ったノートを自分のフォロワーに共有したい場合や、過去の自分のノートを再度共有したい場合に使います。 同じノートに対して無制限にRenoteを行うことができますが、あまり連続して使用すると迷惑になる場合もあるので、注意しましょう。
<div class="warn">⚠️ Se vi havigas al via noto videblecon ke nur al sekvantoj aŭ ke rekte, iliaj ne estos plusendeblaj.</div>

Renoteを削除するには、Renoteの時刻表示の隣にある「...」を押し、「Renote解除」を選択します。

## CW
Contents Warningの略で、ノートの内容を、閲覧者の操作なしには表示しないようにできる機能です。主に長大な内容を隠すためや、ネタバレ防止などに使うことができます。 設定するには、フォームの「内容を隠す」ボタン(目のアイコン)を押します。すると新しい入力エリアが表れるので、そこに内容の要約を記入します。

## Videbleco
ノートごとに、そのノートが公開される範囲を設定することができます。フォームの「ノート」ボタンの左にあるアイコンを押すと公開範囲を以下から選択できます。

### Publika
全ての人に対してノートが公開されるほか、サーバーの全てのタイムライン(ホームタイムライン、ローカルタイムライン、ソーシャルタイムライン、グローバルタイムライン)にノートが流れます。
<div class="warn">⚠️ アカウントが<a href="./silence">サイレンス</a>状態の時は、この公開範囲は使用できません。</div>

### Hejma
全ての人に対してノートが公開されますが、フォロワー以外のローカルタイムライン、ソーシャルタイムライン、グローバルタイムラインにはノートは流れません。

### Nur al sekvantoj
Viaj notoj estos senditaj nur al viaj sekvantoj.La noto aperos sur ĉiuj templinioj de viaj sekvantoj.

### Rekte
指定したユーザーに対してのみノートを公開します。指定したユーザーの全てのタイムラインに流れます。

### 「ローカルのみ」オプション
このオプションを有効にすると、リモートにノートを連合しなくなります。

### 公開範囲の比較
<table>
    <tr><th></th><th>Publika</th><th>Hejma</th><th>Nur al sekvantoj</th><th>Rekte</th></tr>
    <tr><th>フォロワーのLTL/STL/GTL</th><td>✔</td><td>✔</td><td>✔</td><td></td></tr>
    <tr><th>非フォロワーのLTL/STL/GTL</th><td>✔</td><td></td><td></td><td></td></tr>
</table>

## Alpingli sur profilo
ノートをピン留めすると、ユーザーページに常にそのノートを表示しておくことができます。 ノートのメニューを開き、「ピン留め」を選択してピン留めできます。 複数のノートをピン留めできます。

## Observi
Per la funkcio Observi vi povas ricevi novajn sciigojn pri reagoj, respondoj, k.t.p al tiu noto kiu ne apartenas al vi. Por observi noton elektu la "Observi" el la menuo kunteksta de la noto respektiva.
