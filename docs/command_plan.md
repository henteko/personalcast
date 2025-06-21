## 指定したBGM(MP3)ファイルを音声に結合するコマンド: add-bgm

指定したmp3ファイルを結合するコマンド
BGMは最初の3秒はBGMのみで、その後audioの音声が入ったらBGMのボリュームを落とすようにする
最後はボリュームをスムーズに落としながら終わる

例: $ cheercast add-bgm --bgm /path/to/bgm.mp3 --audio /path/to/audio.mp3