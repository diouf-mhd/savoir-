import { KotlinCodeFile } from "../types";

export const KOTLIN_SOURCE_FILES: KotlinCodeFile[] = [
  {
    filename: "Entity.kt",
    packagePath: "com.savoirplus.data.local",
    description: "Modèles d'entités Room (CourseEntity, AssetEntity, QuizEntity)",
    code: `package com.savoirplus.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "courses")
data class CourseEntity(
    @PrimaryKey val id: String,
    val title: String,
    val subject: String,
    val level: String,
    val chapter: String,
    val createdAt: Long
)

@Entity(tableName = "assets")
data class AssetEntity(
    @PrimaryKey val assetId: String,
    val parentId: String,
    val name: String,
    val type: String,
    val storagePath: String,
    val downloadUrl: String
)

@Entity(tableName = "quizzes")
data class QuizEntity(
    @PrimaryKey val id: String,
    val title: String,
    val subject: String,
    val level: String,
    val questionsJson: String
)
`
  },
  {
    filename: "SavoirDao.kt",
    packagePath: "com.savoirplus.data.local",
    description: "Interface DAO Room avec requêtes Flow et opérations hors-ligne",
    code: `package com.savoirplus.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface SavoirDao {
    @Query("SELECT * FROM courses WHERE level = :userLevel ORDER BY createdAt DESC")
    fun getCoursesByLevel(userLevel: String): Flow<List<CourseEntity>>

    @Query("SELECT * FROM assets WHERE parentId = :courseId")
    fun getAssetsForParent(courseId: String): Flow<List<AssetEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCourses(courses: List<CourseEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAssets(assets: List<AssetEntity>)

    @Query("DELETE FROM courses")
    suspend fun clearCourses()
    
    @Query("DELETE FROM assets")
    suspend fun clearAssets()
}
`
  },
  {
    filename: "SyncWorker.kt",
    packagePath: "com.savoirplus.data.worker",
    description: "Worker en arrière-plan WorkManager pour la synchronisation Firestore vers Room",
    code: `package com.savoirplus.data.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.firebase.firestore.FirebaseFirestore
import com.savoirplus.data.local.CourseEntity
import com.savoirplus.data.local.SavoirDao
import kotlinx.coroutines.tasks.await

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters,
    private val dao: SavoirDao
) : CoroutineWorker(appContext, workerParams) {
    override suspend fun doWork(): Result {
        val userLevel = inputData.getString("USER_LEVEL") ?: return Result.failure()
        val db = FirebaseFirestore.getInstance()
        return try {
            val snapshot = db.collection("cours").whereEqualTo("level", userLevel).get().await()
            val courses = snapshot.documents.mapNotNull { doc ->
                CourseEntity(
                    id = doc.id,
                    title = doc.getString("title") ?: "",
                    subject = doc.getString("subject") ?: "",
                    level = doc.getString("level") ?: "",
                    chapter = doc.getString("chapter") ?: "",
                    createdAt = doc.getLong("createdAt") ?: 0L
                )
            }
            dao.insertCourses(courses)
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
`
  },
  {
    filename: "MainActivity.kt",
    packagePath: "com.savoirplus",
    description: "Activité principale Android avec activation du FLAG_SECURE (anti-captures d'écran)",
    code: `package com.savoirplus

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.savoirplus.ui.SavoirPlusApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Sécurité : empêche la capture et l'enregistrement d'écran des cours
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )
        
        setContent {
            SavoirPlusApp()
        }
    }
}
`
  },
  {
    filename: "SavoirPlusTheme.kt",
    packagePath: "com.savoirplus.ui.theme",
    description: "Thème Material Design 3 (Bleu Nuit #1A237E et Fond Blanc #FFFFFF)",
    code: `package com.savoirplus.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val NightBlue = Color(0xFF1A237E)
val WhiteBg = Color(0xFFFFFFFF)
val SecondaryGold = Color(0xFFFFB300)

private val LightColorScheme = lightColorScheme(
    primary = NightBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE8EAF6),
    secondary = SecondaryGold,
    background = WhiteBg,
    surface = WhiteBg
)

@Composable
fun SavoirPlusTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
`
  }
];
