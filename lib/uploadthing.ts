// import { createUploadthing, type FileRouter } from "uploadthing/next"
//
// const f = createUploadthing()
//
// export const ourFileRouter = {
//   // Define as many FileRoutes as you like, each with a unique routeSlug
//   imageUploader: f({ image: { maxFileSize: "4MB" } })
//     // Set permissions and file types for this FileRoute
//     .middleware(async ({ req }) => {
//       // This code runs on your server before upload
//       // If you throw, the user will not be able to upload
//
//       // const user = await auth(req)
//
//       // If you allow different types of files, you can modify the middleware
//       return { uploadedBy: "anonymous" }
//     })
//     .onUploadComplete(async ({ metadata, file }) => {
//       // This code RUNS ON YOUR SERVER after upload
//       console.log("Upload complete for userId:", metadata.uploadedBy)
//
//       console.log("file url", file.url)
//
//       // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
//       return { uploadedBy: metadata.uploadedBy }
//     }),
// } satisfies FileRouter
//
// export type OurFileRouter = typeof ourFileRouter
