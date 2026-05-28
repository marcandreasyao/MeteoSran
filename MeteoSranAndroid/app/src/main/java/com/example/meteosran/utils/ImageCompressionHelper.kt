package com.example.meteosran.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import java.io.ByteArrayOutputStream

data class CompressedImageResult(
    val base64: String,
    val mimeType: String
)

object ImageCompressionHelper {

    /**
     * Resizes and compresses an image from a device Uri.
     * Keeps aspect ratio, scales longest edge to maxDimension, and outputs Base64.
     */
    fun compressAndResizeImage(
        context: Context,
        uri: Uri,
        maxDimension: Int,
        quality: Int
    ): CompressedImageResult? {
        return try {
            val contentResolver = context.contentResolver
            
            // 1. Get original dimensions and MIME type
            val mimeType = contentResolver.getType(uri) ?: "image/jpeg"
            val inputStreamForBounds = contentResolver.openInputStream(uri)
            val options = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            BitmapFactory.decodeStream(inputStreamForBounds, null, options)
            inputStreamForBounds?.close()

            val srcWidth = options.outWidth
            val srcHeight = options.outHeight
            if (srcWidth <= 0 || srcHeight <= 0) return null

            // 2. Calculate scale factor (inSampleSize) for heap efficiency
            var inSampleSize = 1
            while (srcWidth / inSampleSize > maxDimension || srcHeight / inSampleSize > maxDimension) {
                inSampleSize *= 2
            }

            // 3. Decode bitmap with inSampleSize
            val inputStreamForBitmap = contentResolver.openInputStream(uri)
            val decodeOptions = BitmapFactory.Options().apply {
                inSampleSize = inSampleSize
            }
            val scaledBitmap = BitmapFactory.decodeStream(inputStreamForBitmap, null, decodeOptions)
            inputStreamForBitmap?.close()

            if (scaledBitmap == null) return null

            // 4. Precise resize if still larger than maxDimension
            val currentWidth = scaledBitmap.width
            val currentHeight = scaledBitmap.height
            val finalBitmap = if (currentWidth > maxDimension || currentHeight > maxDimension) {
                val ratio = Math.min(maxDimension.toFloat() / currentWidth, maxDimension.toFloat() / currentHeight)
                val targetWidth = (currentWidth * ratio).toInt()
                val targetHeight = (currentHeight * ratio).toInt()
                val resized = Bitmap.createScaledBitmap(scaledBitmap, targetWidth, targetHeight, true)
                if (resized != scaledBitmap) {
                    scaledBitmap.recycle()
                }
                resized
            } else {
                scaledBitmap
            }

            // 5. Compress to byte array
            val outputStream = ByteArrayOutputStream()
            finalBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
            val bytes = outputStream.toByteArray()
            finalBitmap.recycle()

            val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
            CompressedImageResult(base64, "image/jpeg")
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * Resizes and compresses a Base64 encoded image to generate tiny thumbnails.
     */
    fun compressAndResizeBase64(
        base64Data: String,
        maxDimension: Int,
        quality: Int
    ): CompressedImageResult? {
        return try {
            val bytes = Base64.decode(base64Data, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return null

            val currentWidth = bitmap.width
            val currentHeight = bitmap.height
            val finalBitmap = if (currentWidth > maxDimension || currentHeight > maxDimension) {
                val ratio = Math.min(maxDimension.toFloat() / currentWidth, maxDimension.toFloat() / currentHeight)
                val targetWidth = (currentWidth * ratio).toInt()
                val targetHeight = (currentHeight * ratio).toInt()
                val resized = Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
                if (resized != bitmap) {
                    bitmap.recycle()
                }
                resized
            } else {
                bitmap
            }

            val outputStream = ByteArrayOutputStream()
            finalBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
            val outputBytes = outputStream.toByteArray()
            finalBitmap.recycle()

            val base64 = Base64.encodeToString(outputBytes, Base64.NO_WRAP)
            CompressedImageResult(base64, "image/jpeg")
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
