import { Comparator, ImageComparer, Processor } from "image-comparer";
import { User } from "../database/models/user";
import fs from 'fs'
import request from 'request'

function download(uri: any, filename: any, callback: () => void) {
  request.head(uri, function (err: any, res: any, body: any) {
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

export const twitterProfileCheck = async () => {
  // const user = req.user;
  try {
    const userDetails = await User.findOne({ _id: '63fdcfc4b1a45ab2b74edec6' });
    if (userDetails) {
      const userTwitterImage = userDetails.twitterProfileImg;
      console.log(userTwitterImage)
      download(userTwitterImage, 'asset/63fdcfc4b1a45ab2b74edec6.png', function () {
        console.log('done', typeof (__dirname + '/assets/63fdcfc4b1a45ab2b74edec6.png'))
        const ImgBufA = Buffer.from('http://localhost:5001/rewards/jet.jpeg');
        const ImgBufB = Buffer.from('http://localhost:5001/rewards/jet.jpeg');
        console.log(ImgBufA, ImgBufB)
        ImageComparer.create()
          .withProcessor(Processor.MEAN_PIXEL())
          .withComparator(Comparator.RGBA_PCT(0.2))
          .compare(ImgBufA, ImgBufB)
          .then((res) => console.log(res.pct))
      })

    }
  } catch (e) {
    console.log(e)
  }
}



// twitterProfileCheck();
